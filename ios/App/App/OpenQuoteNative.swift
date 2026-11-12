import Capacitor
import Foundation
import Security
import UIKit
import WebKit

/// The app's own native helpers, called from the web code (src/lib/ai/keys.ts, src/lib/publik.ts, src/lib/share.ts):
///   getSecret / setSecret / deleteSecret   AI keys in the iPhone Keychain (this device only, never in backups)
///   publikStatus / publikStart / publikPress / publikKey / publikSetChoice   Sign in with publik (Publik.swift)
///   sharePdf                               the screen as an A4 PDF (print styles), then the Share sheet
@objc(OpenQuoteNativePlugin)
public class OpenQuoteNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OpenQuoteNativePlugin"
    public let jsName = "OpenQuoteNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteSecret", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "publikStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "publikStart", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "publikPress", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "publikKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "publikSetChoice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sharePdf", returnType: CAPPluginReturnPromise),
    ]

    private lazy var gate = PublikGateBridge(plugin: self)
    private var gateTask: Task<Void, Never>?

    override public func load() {
        Publik.deviceName = UIDevice.current.name
    }

    // MARK: Keychain

    private static let service = "OpenQuote AU"

    private func keychainQuery(_ key: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: Self.service, kSecAttrAccount as String: key]
    }

    @objc func getSecret(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("Missing key") }
        var query = keychainQuery(key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) {
            call.resolve(["value": value])
        } else {
            call.resolve(["value": NSNull()])
        }
    }

    @objc func setSecret(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else { return call.reject("Missing key or value") }
        SecItemDelete(keychainQuery(key) as CFDictionary)
        var item = keychainQuery(key)
        item[kSecValueData as String] = Data(value.utf8)
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status = SecItemAdd(item as CFDictionary, nil)
        status == errSecSuccess ? call.resolve() : call.reject("Couldn't save to the Keychain (\(status))")
    }

    @objc func deleteSecret(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("Missing key") }
        SecItemDelete(keychainQuery(key) as CFDictionary)
        call.resolve()
    }

    // MARK: Sign in with publik

    /// Whether this build can sign in with publik, and whether it has already.
    @objc func publikStatus(_ call: CAPPluginCall) {
        let credential = Publik.readCredential()
        call.resolve([
            "configured": Publik.isConfigured,
            "provisioned": credential != nil,
            "choice": credential?.choice ?? NSNull(),
        ])
    }

    /// Runs the gate. Each screen arrives as a "publikScreen" event; the web UI answers with publikPress.
    /// Resolves once the person is signed in (and has chosen how to pay for AI).
    @objc func publikStart(_ call: CAPPluginCall) {
        guard Publik.isConfigured else { return call.resolve(["signedIn": false, "configured": false]) }
        gateTask?.cancel()
        gateTask = Task {
            let result = await Publik.ensureSignedIn(gate)
            await MainActor.run { self.notifyListeners("publikScreen", data: ["id": "done"]) }
            call.resolve(["signedIn": true, "configured": true, "choice": result.choice ?? NSNull(), "handle": result.wallet.handle ?? NSNull()])
        }
    }

    @objc func publikPress(_ call: CAPPluginCall) {
        gate.press(call.getString("action"))
        call.resolve()
    }

    /// The install key, when the person chose to pay with their publik plan.
    @objc func publikKey(_ call: CAPPluginCall) {
        if case let .publik(_, apiKey) = Publik.resolveProvider(userKey: nil) {
            call.resolve(["key": apiKey])
        } else {
            call.resolve(["key": NSNull()])
        }
    }

    /// Settings → AI: "publik", "own_key", or null to ask again on the next start.
    @objc func publikSetChoice(_ call: CAPPluginCall) {
        Publik.setChoice(call.getString("choice"))
        call.resolve()
    }

    func emitScreen(_ screen: Publik.Screen) {
        notifyListeners("publikScreen", data: [
            "id": screen.id,
            "title": screen.title,
            "body": screen.body,
            "note": screen.note ?? NSNull(),
            "buttons": screen.buttons.map { ["action": $0.action, "label": $0.label] },
        ])
    }

    // MARK: PDF

    /// Lays the current screen out on A4 pages with its print styles and opens the Share sheet with the PDF.
    @objc func sharePdf(_ call: CAPPluginCall) {
        let name = (call.getString("fileName") ?? "Quote").replacingOccurrences(of: "/", with: "-")
        let text = call.getString("text")
        DispatchQueue.main.async {
            guard let webView = self.bridge?.webView, let presenter = self.bridge?.viewController else {
                return call.reject("The app isn't ready.")
            }
            let a4 = CGRect(x: 0, y: 0, width: 595.2, height: 841.8)
            let renderer = UIPrintPageRenderer()
            renderer.addPrintFormatter(webView.viewPrintFormatter(), startingAtPageAt: 0)
            renderer.setValue(NSValue(cgRect: a4), forKey: "paperRect")
            renderer.setValue(NSValue(cgRect: a4.insetBy(dx: 36, dy: 40)), forKey: "printableRect")

            let data = NSMutableData()
            UIGraphicsBeginPDFContextToData(data, a4, [kCGPDFContextTitle as String: name, kCGPDFContextCreator as String: "OpenQuote AU"])
            renderer.prepare(forDrawingPages: NSRange(location: 0, length: renderer.numberOfPages))
            for page in 0..<renderer.numberOfPages {
                UIGraphicsBeginPDFPage()
                renderer.drawPage(at: page, in: UIGraphicsGetPDFContextBounds())
            }
            UIGraphicsEndPDFContext()

            let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(name).pdf")
            do {
                try data.write(to: url, options: .atomic)
            } catch {
                return call.reject("Couldn't make the PDF.")
            }
            // The message goes with the PDF (Messages and Mail put it in the body).
            let items: [Any] = text.map { [$0, url] } ?? [url]
            let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
            sheet.popoverPresentationController?.sourceView = presenter.view
            sheet.popoverPresentationController?.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.maxY - 80, width: 1, height: 1)
            sheet.completionWithItemsHandler = { activity, completed, _, _ in
                call.resolve(["completed": completed, "activity": activity?.rawValue ?? NSNull(), "pages": renderer.numberOfPages])
            }
            presenter.present(sheet, animated: true)
        }
    }
}

/// Shows publik's gate screens in the web UI and waits for the button the person presses.
final class PublikGateBridge: PublikGateUI, @unchecked Sendable {
    private weak var plugin: OpenQuoteNativePlugin?
    private var pick: CheckedContinuation<String?, Never>?
    private let lock = NSLock()

    init(plugin: OpenQuoteNativePlugin) { self.plugin = plugin }

    func show(_ screen: Publik.Screen) async -> String? {
        await withTaskCancellationHandler {
            await withCheckedContinuation { (c: CheckedContinuation<String?, Never>) in
                lock.lock()
                pick?.resume(returning: nil)
                pick = c
                lock.unlock()
                DispatchQueue.main.async { self.plugin?.emitScreen(screen) }
            }
        } onCancel: {
            self.press(nil)
        }
    }

    func press(_ action: String?) {
        lock.lock()
        let c = pick
        pick = nil
        lock.unlock()
        c?.resume(returning: action)
    }

    func open(_ url: URL) {
        DispatchQueue.main.async { UIApplication.shared.open(url) }
    }
}
