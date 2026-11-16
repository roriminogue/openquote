// Draws docs/social-preview.png (1280 × 640, at 2× for sharp text; under GitHub's 1 MB limit), the card GitHub and LinkedIn show for a link to the repo. Upload it in
// GitHub → Settings → General → Social preview. Re-run after new screenshots:
//   swift scripts/social-preview.swift node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2 docs
import AppKit
import CoreText

let fontURL = URL(fileURLWithPath: CommandLine.arguments[1]); let docs = CommandLine.arguments[2]
let descs = CTFontManagerCreateFontDescriptorsFromData(try! Data(contentsOf: fontURL) as CFData) as! [CTFontDescriptor]
func figtree(_ size: CGFloat, _ weight: Int) -> CTFont {
  let base = CTFontCreateWithFontDescriptor(descs[0], size, nil)
  return CTFontCreateWithFontDescriptor(CTFontDescriptorCreateCopyWithAttributes(CTFontCopyFontDescriptor(base),
    [kCTFontVariationAttribute: [2003265652: weight]] as CFDictionary), size, nil)
}
func rgb(_ hex: Int, _ a: CGFloat = 1) -> CGColor { CGColor(srgbRed: CGFloat((hex>>16)&255)/255, green: CGFloat((hex>>8)&255)/255, blue: CGFloat(hex&255)/255, alpha: a) }

let W = 1280, H = 640, scale = 2
let ctx = CGContext(data: nil, width: W*scale, height: H*scale, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.scaleBy(x: CGFloat(scale), y: CGFloat(scale))
ctx.setFillColor(rgb(0xf3f3f1)); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
func top(_ y: CGFloat) -> CGFloat { CGFloat(H) - y }

// Text, top-down coordinates; returns the width drawn.
@discardableResult func text(_ s: String, _ x: CGFloat, _ baseline: CGFloat, _ size: CGFloat, _ weight: Int, _ color: Int, tracking: CGFloat = 0) -> CGFloat {
  let line = CTLineCreateWithAttributedString(NSAttributedString(string: s, attributes: [
    kCTFontAttributeName as NSAttributedString.Key: figtree(size, weight),
    kCTForegroundColorAttributeName as NSAttributedString.Key: rgb(color),
    kCTKernAttributeName as NSAttributedString.Key: tracking * size]))
  ctx.textPosition = CGPoint(x: x, y: top(baseline)); CTLineDraw(line, ctx)
  return CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
}

// Wordmark.
let x0: CGFloat = 80, m: CGFloat = 52, k = m / 24, my = top(96 + m)
ctx.setFillColor(rgb(0x000000)); ctx.addPath(CGPath(roundedRect: CGRect(x: x0, y: my, width: m, height: m), cornerWidth: 6.5*k, cornerHeight: 6.5*k, transform: nil)); ctx.fillPath()
func stroke(_ a: CGFloat, _ b: CGFloat, _ y: CGFloat, _ w: CGFloat, _ c: Int) {
  ctx.setStrokeColor(rgb(c)); ctx.setLineWidth(w*k); ctx.setLineCap(.round)
  ctx.move(to: CGPoint(x: x0 + a*k, y: my + (24-y)*k)); ctx.addLine(to: CGPoint(x: x0 + b*k, y: my + (24-y)*k)); ctx.strokePath()
}
stroke(7, 17, 8, 2, 0xf3f3f1); stroke(7, 17, 12, 2, 0xf3f3f1); stroke(12.5, 17, 16.5, 2.25, 0xfa7d21)
let wq = text("OpenQuote", x0 + m + 18, 96 + m/2 + 13, 38, 600, 0x000000, tracking: -0.01)
text("AU", x0 + m + 18 + wq + 11, 96 + m/2 + 13, 38, 500, 0x474747, tracking: -0.01)

// Headline and lines under it.
text("AI quoting for", x0, 268, 62, 700, 0x000000, tracking: -0.025)
text("Australian tradies", x0, 340, 62, 700, 0x000000, tracking: -0.025)
text("Describe a job the way you’d tell a mate.", x0, 410, 26, 400, 0x474747)
text("Get it priced with your rates, send a PDF.", x0, 446, 26, 400, 0x474747)
text("Free  ·  Open source  ·  Runs on your phone", x0, 540, 22, 600, 0xa8350a)

// Two phone screens, bleeding off the bottom.
func phone(_ file: String, _ x: CGFloat, _ y: CGFloat, _ h: CGFloat) {
  let img = NSImage(contentsOfFile: "\(docs)/screenshots/\(file)")!
  var r = CGRect(x: 0, y: 0, width: img.size.width, height: img.size.height)
  let cg = img.cgImage(forProposedRect: &r, context: nil, hints: nil)!
  let w = h * CGFloat(cg.width) / CGFloat(cg.height)
  let frame = CGRect(x: x, y: top(y + h), width: w, height: h)
  let path = CGPath(roundedRect: frame, cornerWidth: 34, cornerHeight: 34, transform: nil)
  ctx.saveGState(); ctx.setShadow(offset: CGSize(width: 0, height: -14), blur: 40, color: rgb(0x000000, 0.16))
  ctx.addPath(path); ctx.setFillColor(rgb(0xffffff)); ctx.fillPath(); ctx.restoreGState()
  ctx.saveGState(); ctx.addPath(path); ctx.clip(); ctx.interpolationQuality = .high; ctx.draw(cg, in: frame); ctx.restoreGState()
  ctx.addPath(path); ctx.setStrokeColor(rgb(0x000000, 0.10)); ctx.setLineWidth(1.5); ctx.strokePath()
}
phone("3-estimate.jpg", 700, 84, 700)
phone("4-quote.jpg", 950, 150, 700)

let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(docs)/social-preview.png"))
