// Bryce Araujo: business card widget for Scriptable (iPhone)
//
// Home Screen: the front or the back of the business card. Lock Screen: the website's QR code. Tapping either opens the website.
// Set it up (details in the README):
//   1. Put this file in Scriptable as a script named "Business card".
//   2. Add a medium Scriptable widget. Edit it: Script = Business card, Parameter = front.
//   3. Add a second one with Parameter = back, then drag it onto the first to stack them.
//      Swipe up or down on the stack to flip between the front and the back.
//   4. Touch and hold the stack, tap Edit Stack, and turn off Smart Rotate so iOS doesn't flip it on its own.
//   5. Lock Screen: customise it, tap the widget area, add Scriptable's wide (rectangular) widget, then tap it
//      and set Script = Business card.
// Parameter "flip" instead shows one widget that alternates sides each time iOS refreshes it.

const SITE = 'https://brycearaujo.github.io/brycearaujo.me/';
const IMAGES = SITE + 'img/widget/';
const COLORS = { front: '#F0EAD6', back: '#722F37' };   // the card's cream front and wine back
const TEXT = { front: '#3A281C', back: '#F0EAD6' };

const fm = FileManager.local();
const dir = fm.joinPath(fm.documentsDirectory(), 'business-card');
if (!fm.fileExists(dir)) fm.createDirectory(dir);

// Which side to show, from the widget's Parameter: "front" (the default), "back" or "flip"
function chooseSide(param) {
  const p = String(param || 'front').trim().toLowerCase();
  if (p === 'back') return 'back';
  if (p !== 'flip') return 'front';
  const state = fm.joinPath(dir, 'last-side.txt');
  const next = fm.fileExists(state) && fm.readString(state) === 'front' ? 'back' : 'front';
  fm.writeString(state, next);
  return next;
}

// An image from the website, saved on the phone as well, so the widget still works offline
async function siteImage(name) {
  const path = fm.joinPath(dir, name);
  try {
    const req = new Request(IMAGES + name);
    req.timeoutInterval = 15;
    const img = await req.loadImage();
    fm.writeImage(path, img);
    return img;
  } catch (e) {
    return fm.fileExists(path) ? fm.readImage(path) : null;
  }
}

// Home Screen (made for the medium size): the card
async function cardWidget(side) {
  const w = new ListWidget();
  w.url = SITE;   // tapping the widget opens the website
  w.backgroundColor = new Color(COLORS[side]);
  const img = await siteImage(`card-${side}-wide.png`);
  if (img) {
    w.backgroundImage = img;
  } else {
    // The very first run with no internet yet: a plain text version of the card
    const name = w.addText('Bryce Araujo');
    name.font = Font.boldSystemFont(18);
    name.textColor = new Color(TEXT[side]);
    w.addSpacer(4);
    for (const line of ['brycejaraujo@gmail.com', '240-360-6065']) {
      const t = w.addText(line);
      t.font = Font.systemFont(12);
      t.textColor = new Color(TEXT[side]);
    }
  }
  return w;
}

// Lock Screen: just the QR code, in white on a see-through background. iOS tints it the clock's colour, and the
// wallpaper shows between the squares, so it needs a dark wallpaper behind it. Made for the wide (rectangular) slot;
// the round slot is clipped to a circle, so it gets a smaller code that fits inside. Parameter "backdrop" adds Apple's
// blurred widget backing, which smooths out a busy (but dark) wallpaper behind the code. It doesn't darken a light one.
async function lockWidget(family, param) {
  const w = new ListWidget();
  w.url = SITE;   // tapping it (after unlocking) opens the website
  const round = family === 'accessoryCircular';
  if (String(param || '').trim().toLowerCase() === 'backdrop') w.addAccessoryWidgetBackground = true;
  const qr = family === 'accessoryInline' ? null : await siteImage(round ? 'lock-qr-round.png' : 'lock-qr.png');
  if (qr) {
    w.setPadding(0, 0, 0, 0);
    w.addSpacer();
    const row = w.addStack();
    row.addSpacer();
    // The images are 216 and 144 px: exactly 72 and 48 pt on a 3x iPhone, so iOS shows them pixel for pixel
    row.addImage(qr).imageSize = round ? new Size(48, 48) : new Size(72, 72);
    row.addSpacer();
    w.addSpacer();
  } else {
    // The one-line widget above the clock (it can't show a picture), or no internet on the first run
    const name = w.addText(family === 'accessoryCircular' ? 'BA' : 'Bryce Araujo');
    name.font = Font.boldSystemFont(14);
    name.textColor = Color.white();
  }
  return w;
}

const buildWidget = (family, param) =>
  String(family || '').startsWith('accessory') ? lockWidget(family, param) : cardWidget(chooseSide(param));

const param = args.widgetParameter;
if (config.runsInWidget) {
  const w = await buildWidget(config.widgetFamily, param);
  if (config.widgetFamily === 'medium' && String(param || '').trim().toLowerCase() === 'flip') w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  Script.setWidget(w);
} else {
  // Run inside Scriptable: preview each widget
  const menu = new Alert();
  menu.title = 'Business card';
  menu.message = 'Preview a widget';
  menu.addAction('Front');
  menu.addAction('Back');
  menu.addAction('Lock Screen QR code');
  menu.addCancelAction('Done');
  const pick = await menu.presentSheet();
  if (pick === 0 || pick === 1) await (await cardWidget(pick === 0 ? 'front' : 'back')).presentMedium();
  if (pick === 2) await (await lockWidget('accessoryRectangular')).presentAccessoryRectangular();
}
Script.complete();
