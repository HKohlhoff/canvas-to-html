export const CURRENT_RELEASE_NOTES_ID = "release-1.3.2";

export const CURRENT_RELEASE_NOTES_MARKDOWN = `# Canvas HTML Exporter 1.3.2: More reliable exports

This maintenance update improves links, assets, keyboard navigation and the
automatic update description. Your existing export settings remain in place.
Package folders and single HTML files continue to support the same Canvas
content and folding controls.

## Links and files arrive where they belong

- **Text nodes:** internal note links and image embeds now resolve in exported
  text nodes as they do in Markdown file nodes.
- **Linked notes:** links between notes that reference each other remain usable
  in single HTML. Recursive section embeds finish with a readable fallback.
- **PDFs:** PDFs with the same name in different folders receive separate
  viewer pages, including when names contain spaces or \`#\`.
- **Output folders:** copied assets stay in the selected absolute folder.
  Vault-root output, Windows drive roots and network-share paths are preserved.
- **Safer output:** literal script-closing text remains content, and executable
  link schemes are blocked in Markdown links and link-node previews.

To use these fixes, export the original Canvas again. Choose **Package folder**
or **Single HTML file** in settings as usual; existing exported files do not
update themselves. To export into the Vault root, choose it with **Choose vault
folder** or enter \`.\` as the output folder.

## Smoother controls

- In **Search**, Tab and Shift+Tab stay inside the dialog. Closing it returns
  keyboard focus to the control that opened it.
- Cancelling the folder picker now ends the selection cleanly.
- The **Folding** menu is also available on Canvases containing only groups.
- Repeated export commands no longer start overlapping exports.

Folding continues to change only the exported view; the source \`.canvas\` file
is not modified.

## Update descriptions after every version change

This description opens automatically once for version 1.3.2, including when
you have already read an earlier version's description. It is marked as read
only after you close it and does not open again on every Obsidian start.

Use **Show last update** at the bottom of the Canvas HTML Exporter settings to
reopen it at any time, or **Show readme** for the full documentation. Closing it
leaves no note or other content file in your Vault. Open plugin dialogs also
close when the plugin is disabled.

If Canvas HTML Exporter makes your Canvas work easier, you can [buy me a coffee on
Ko-fi](https://ko-fi.com/hokdev). Thank you!
`;
