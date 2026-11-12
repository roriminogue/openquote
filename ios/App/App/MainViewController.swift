import Capacitor
import UIKit

/// The app's screen: Capacitor's web view, plus the app's own native plugin (OpenQuoteNative.swift).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(OpenQuoteNativePlugin())
    }
}
