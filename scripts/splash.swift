// Draws iOS launch images for the Home Screen app: the OpenQuote AU logo centred on the page colour, light and dark,
// one per iPhone screen shape. index.html links them (apple-touch-startup-image). Re-run after changing the logo,
// its colours or the device list, and keep the list in index.html in step:
//   swift scripts/splash.swift node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2 public/splash
import CoreText
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let fontURL = URL(fileURLWithPath: CommandLine.arguments[1]); let outDir = CommandLine.arguments[2]
let descs = CTFontManagerCreateFontDescriptorsFromData(try! Data(contentsOf: fontURL) as CFData) as! [CTFontDescriptor]
func figtree(_ size: CGFloat, _ weight: Int) -> CTFont {
  let base = CTFontCreateWithFontDescriptor(descs[0], size, nil)
  let d = CTFontDescriptorCreateCopyWithAttributes(CTFontCopyFontDescriptor(base),
    [kCTFontVariationAttribute: [2003265652: weight]] as CFDictionary)
  return CTFontCreateWithFontDescriptor(d, size, nil)
}
func rgb(_ hex: Int) -> CGColor { CGColor(srgbRed: CGFloat((hex>>16)&255)/255, green: CGFloat((hex>>8)&255)/255, blue: CGFloat(hex&255)/255, alpha: 1) }
struct Scheme { let name: String; let bg, text, secondary, accent: Int }
let schemes = [Scheme(name: "light", bg: 0xffffff, text: 0x000000, secondary: 0x474747, accent: 0xfa7d21),
               Scheme(name: "dark", bg: 0x262626, text: 0xf2f2f2, secondary: 0xb4b4b4, accent: 0xfa7d21)]
// Portrait CSS size, pixel ratio and top safe area (status bar) of each iPhone shape. The Home Screen app's page starts
// below the status bar, so its splash is centred in the area under it; the launch image puts the logo in the same
// place (half the status bar lower than the screen's centre), or the logo jumps when the page takes over.
// (Measured on the iPhone 17 Pro simulator: 62. The rest are each model's top safe area.)
let devices: [(Int, Int, Int, Int)] = [(440,956,3,62),(420,912,3,62),(430,932,3,59),(402,874,3,62),(393,852,3,59),(428,926,3,47),(390,844,3,47),(414,896,3,44),(414,896,2,48),(375,812,3,44),(375,667,2,20)]

let fs: CGFloat = 17, tracking: CGFloat = -0.01 * 17, lineH: CGFloat = 1.5 * 17
func line(_ s: Scheme) -> CTLine {
  let a = NSMutableAttributedString(string: "OpenQuote AU")
  a.addAttributes([kCTFontAttributeName as NSAttributedString.Key: figtree(fs, 600), kCTForegroundColorAttributeName as NSAttributedString.Key: rgb(s.text), kCTKernAttributeName as NSAttributedString.Key: tracking], range: NSRange(location: 0, length: 9))
  // The 0.3em gap before "AU" (margin-left in CSS), drawn as the space's kerning.
  let space = figtree(fs, 500)
  let spaceW = CTLineGetTypographicBounds(CTLineCreateWithAttributedString(NSAttributedString(string: " ", attributes: [kCTFontAttributeName as NSAttributedString.Key: space])), nil, nil, nil)
  a.addAttributes([kCTFontAttributeName as NSAttributedString.Key: space, kCTKernAttributeName as NSAttributedString.Key: 0.3*fs - spaceW + tracking], range: NSRange(location: 9, length: 1))
  a.addAttributes([kCTFontAttributeName as NSAttributedString.Key: figtree(fs, 500), kCTForegroundColorAttributeName as NSAttributedString.Key: rgb(s.secondary), kCTKernAttributeName as NSAttributedString.Key: tracking], range: NSRange(location: 10, length: 2))
  return CTLineCreateWithAttributedString(a)
}
for (w, h, r, top) in devices { for s in schemes {
  let pw = w*r, ph = h*r
  let ctx = CGContext(data: nil, width: pw, height: ph, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  ctx.setFillColor(rgb(s.bg)); ctx.fill(CGRect(x: 0, y: 0, width: pw, height: ph))
  ctx.scaleBy(x: CGFloat(r), y: CGFloat(r))
  let ln = line(s)
  var asc: CGFloat = 0, desc: CGFloat = 0
  let textW = CGFloat(CTLineGetTypographicBounds(ln, &asc, &desc, nil)) - tracking  // no tracking after the last letter
  let mark: CGFloat = 22, gap: CGFloat = 8
  let groupW = mark + gap + textW
  let x0 = (CGFloat(w) - groupW) / 2
  let cy = CGFloat(h - top) / 2   // centre of the area below the status bar, measured from the bottom (CG coordinates)
  // Mark: 24-unit viewBox scaled to 22px, centred on the line.
  let k = mark / 24, mx = x0, my = cy - mark/2
  ctx.setFillColor(rgb(s.text))
  ctx.addPath(CGPath(roundedRect: CGRect(x: mx, y: my, width: mark, height: mark), cornerWidth: 6.5*k, cornerHeight: 6.5*k, transform: nil)); ctx.fillPath()
  func stroke(_ x1: CGFloat, _ x2: CGFloat, _ y: CGFloat, _ wd: CGFloat, _ c: Int) {
    ctx.setStrokeColor(rgb(c)); ctx.setLineWidth(wd*k); ctx.setLineCap(.round)
    ctx.move(to: CGPoint(x: mx + x1*k, y: my + (24-y)*k)); ctx.addLine(to: CGPoint(x: mx + x2*k, y: my + (24-y)*k)); ctx.strokePath()
  }
  stroke(7, 17, 8, 2, s.bg); stroke(7, 17, 12, 2, s.bg); stroke(12.5, 17, 16.5, 2.25, s.accent)
  // Text: CSS centres the line box (1.5 line height) on the mark; the baseline sits half-leading + ascent below its top.
  let halfLeading = (lineH - (asc + desc)) / 2
  let baselineFromTop = halfLeading + asc
  let lineTop = cy + lineH/2
  ctx.textPosition = CGPoint(x: x0 + mark + gap, y: lineTop - baselineFromTop)
  CTLineDraw(ln, ctx)
  let img = ctx.makeImage()!
  let url = URL(fileURLWithPath: "\(outDir)/\(w)x\(h)@\(r)x-\(s.name).png")
  let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, img, nil); CGImageDestinationFinalize(dest)
}}
print("done")
