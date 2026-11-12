# OpenQuote AU on your iPhone

The whole app is installed on the phone: screens, data and all. Nothing runs on a server, so it works with no
signal (pricing a job with AI needs one).

You don't need a paid Apple Developer account. A free Apple ID works, but Apple makes free-account apps stop
opening after **7 days**. When that happens, plug the phone in and run the install script again (step 4). Your
quotes stay on the phone.

## You'll need

- A Mac with **Xcode** (free from the App Store) and about 4 GB of free disk space
- Node 22 or later
- Your iPhone and a USB cable

## Steps

1. **Sign Xcode in to your Apple ID.** In Xcode → Settings → Accounts, click **+** → **Apple ID**.
2. **Tell the build who you are.** Create `ios/signing.local.xcconfig` with a bundle identifier that's unique to
   you, and your team ID (Xcode → Settings → Accounts → your Apple ID → the ID next to "Personal Team"):

   ```
   PRODUCT_BUNDLE_IDENTIFIER = com.yourname.openquote
   DEVELOPMENT_TEAM = ABCDE12345
   ```

   It stays on your Mac and is never committed. Then, in Terminal from the OpenQuote AU folder:

   ```bash
   npm install
   ```

3. **Get the iPhone ready.** Plug it in, unlock it and tap **Trust** if asked. Turn on **Developer Mode** in
   Settings → Privacy & Security (it appears after the first install attempt, and the phone restarts).
4. **Install.** In Terminal:

   ```bash
   ./ios/install-on-iphone.sh
   ```

   The first build downloads a few libraries and takes a few minutes. To start with a backup on the phone (for
   example one made from the old web version), add `--data path/to/backup.oqbackup` on the first install only: it
   replaces what's on the phone.
5. **Trust it on the phone, once.** Settings → General → VPN & Device Management → your Apple ID → **Trust**.
   Then open OpenQuote AU.

## AI

Add your AI key in **Settings → AI** (Anthropic, OpenAI, Google, OpenRouter, or Ollama on a computer on your
Wi-Fi). The key is kept in the iPhone's Keychain. Builds published on publik open with **Sign in with publik**
instead, and can use a publik plan with no key.

## If something goes wrong

- **"No iPhone found":** unlock the phone, replug it, and tap **Trust**.
- **The build hangs at "Resolve Package Graph":** the Mac's download service sometimes stalls. Quit Xcode and run
  the script again.
- **"Untrusted Developer" when opening the app:** do step 5.
