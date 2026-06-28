Image Converter

A tiny drag-and-drop web app that converts images between PNG and JPG and lets you compress JPEG output.

How to use

- Open `index.html` in your browser (double-click or serve with a local static server).
- Drag & drop a PNG or JPG into the drop area, or click "browse".
- Select the desired output format (`JPG` or `PNG`).
- Adjust the `Quality` slider (affects JPEG only).
- Click `Convert & Compress` (or it auto-converts on file load) and then download.

Notes

- PNG output typically ignores the quality parameter; use JPG for compression.
- For large images, conversion may use noticeable memory/time depending on the browser.

Files

- index.html — UI
- styles.css — styles
- script.js — conversion logic
 - index.html — UI
 - styles.css — styles
 - script.js — conversion logic

Run locally

To serve the app locally using the included zero-dependency Node server:

```bash
node server.js
# or
npm start
```

Then open http://localhost:3000 in your browser.

If you don't have Node installed, you can use Python's built-in server instead:

```bash
python3 -m http.server 3000
```

Then open http://localhost:3000 in your browser.

Notes

Want me to add an npm script that installs dependencies automatically?"