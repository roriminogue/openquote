# OpenQuote on your iPhone, as an app

The iPhone app is a thin shell around your own OpenQuote website: it opens your site full screen with the
OpenQuote icon. Every update to your site shows up in the app straight away, with no reinstall needed.

You don't need a paid Apple Developer account. A free Apple ID works, but Apple makes free-account apps stop
opening after **7 days**. When that happens, plug the phone in and run the install script again (step 4). It
takes about a minute.

If you'd rather skip all this, open your site in Safari and tap **Share → Add to Home Screen**. You get nearly
the same thing.

## You'll need

- A Mac with **Xcode** (free from the App Store) and about 4 GB of free disk space
- Your iPhone and a USB cable
- Your OpenQuote site already online (see the main [README](../README.md))

## Steps

1. **Sign Xcode in to your Apple ID.** In Xcode → Settings → Accounts, click **+** → **Apple ID**.
2. **Point the app at your site and your Apple ID.**
   - Add your site's address to `.env.local` in the OpenQuote folder (create the file if it isn't there):
     `OPENQUOTE_APP_URL=https://your-site.vercel.app`
   - Create `ios/signing.local.xcconfig` with a bundle identifier that's unique to you, and your team ID
     (Xcode → Settings → Accounts → your Apple ID → the ID next to "Personal Team"):

     ```
     PRODUCT_BUNDLE_IDENTIFIER = com.yourname.openquote
     DEVELOPMENT_TEAM = ABCDE12345
     ```

   Both files stay on your Mac and are never committed. Then, in Terminal from the OpenQuote folder:

   ```bash
   npm install
   npx cap sync ios
   ```

3. **Get the iPhone ready.** Plug it in, unlock it and tap **Trust** if asked. Turn on **Developer Mode** in
   Settings → Privacy & Security (it appears after the first install attempt, and the phone restarts).
4. **Install.** In Terminal:

   ```bash
   ./ios/install-on-iphone.sh
   ```

   The first build downloads a few libraries and takes a few minutes.
5. **Trust it on the phone, once.** Settings → General → VPN & Device Management → your Apple ID → **Trust**.
   Then open OpenQuote.

## Signing in inside the app

Use your email and password (set one in **Settings → Account** on the website first). Email sign-in links also
work: tap the link in the email on the phone, and it hands you back to the app.

## If something goes wrong

- **"No paired iPhone found":** unlock the phone, replug it, and tap **Trust**.
- **The build hangs at "Resolve Package Graph":** the Mac's download service sometimes stalls. Quit Xcode, run
  the script again, and if it still hangs, restart the Mac.
- **"Unable to launch … not been explicitly trusted":** do step 5.
- **It stopped opening after a week:** run step 4 again.
