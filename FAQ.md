# Frequently asked questions

## About the add-on

### Is Color Picker really free?

Yes. Color Picker is free and open source under the GPL-3.0 license, the same family of license as Blender. You can download it from the [latest GitHub release](https://github.com/jfranmatheu/Blender-Color-Picker/releases/latest), use it in personal and commercial work, study the code and share it.

### Then why is it sold on Superhive and Payhip?

Buying it is how you support its development. Color Picker is made by one independent developer, and every new Blender version can break add-ons. Purchases pay for updates, bug fixes and new features, and keep the add-on free for everyone, including students, hobbyists and artists who can't pay for tools right now.

- [Get it on Superhive](https://superhivemarket.com/products/color-picker)
- [Get it on Payhip](https://payhip.com/b/gZ6F4)

### Is the store version different from the GitHub version?

No. It's the same add-on. Buying it doesn't unlock extra features; it supports the project.

### I can't afford it. Can I still use it?

Absolutely. Download it from [GitHub](https://github.com/jfranmatheu/Blender-Color-Picker/releases/latest). That's exactly why it's free.

## Compatibility

### Which Blender versions are supported?

The current version (1.3.0) needs **Blender 5.0 or newer** and is tested in Blender 5.3. Older builds for Blender 2.93, 3.x and 4.x are in the repository's [`releases`](releases) folder. They don't receive updates.

### Which modes does it work in?

**Texture Paint**, **Vertex Paint** and **Weight Paint**, in the 3D Viewport. It doesn't work in Sculpt Mode, Grease Pencil, or the Image Editor.

## Installation

### How do I install it?

1. Download the zip from the [latest release](https://github.com/jfranmatheu/Blender-Color-Picker/releases/latest) (or from your store purchase).
2. In Blender, go to *Edit > Preferences > Get Extensions*, open the menu in the top-right corner and choose *Install from Disk…*, then select the zip. You can also drag and drop the zip into Blender.

Don't unzip it first: Blender installs the zip directly.

### How do I update to a new version?

Install the new zip the same way. Blender replaces the old version.

## Using it

### The picker doesn't open when I press Space. What's wrong?

Check that:

- You're in Texture Paint, Vertex Paint or Weight Paint mode.
- Your mouse is over the 3D Viewport, not over a panel or another editor.
- A brush is active in that paint mode.
- The hotkey wasn't changed. You can see it in the sidebar (`N`) under *Paint > Color Picker*, or in the add-on's preferences.

### Space used to play my animation. Can I use another key?

Yes. In paint modes, Color Picker uses `Space` by default. You can rebind it separately for each paint mode in the add-on's preferences or in the sidebar panel.

### The picker closes as soon as I release the key. Can it stay open?

Yes. Turn off *Close on Hot-key Release*. The picker then stays open until you press the key again, click outside it, or press `Esc`.

### Which color does it change, the brush or the shared color?

The same one Blender would. If *Unified Color* is on, it changes the shared color; otherwise it changes the active brush's own color.

### The picker is too small or too large on my screen.

Raise or lower *Screen DPI* in the settings. For finer control, use *Scale Factor* in the add-on's preferences (0.5 to 2).

### Can I see the hex code of the color?

Yes. Turn on *Show Hex* in the settings.

## Help and contributing

### I found a bug. Where do I report it?

Open an issue on [GitHub](https://github.com/jfranmatheu/Blender-Color-Picker/issues). Include your Blender version, your operating system, the paint mode, and any error from Blender's system console.

More details are in the [documentation](DOCS.md) and the [README](README.md).
