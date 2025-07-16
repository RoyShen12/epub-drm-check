const AdmZip = require('adm-zip');
const fs = require('fs').promises;
const path = require('path');

async function createEPUBTestFiles() {
  const testDir = path.join(__dirname, 'test-files');

  // Create a valid EPUB
  const zip = new AdmZip();

  // Add mimetype
  zip.addFile('mimetype', Buffer.from('application/epub+zip'), '', 0);

  // Add container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.addFile('META-INF/container.xml', Buffer.from(containerXml));

  // Add content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test Book</dc:title>
    <dc:creator>Test Author</dc:creator>
    <dc:identifier id="uid">test-book-001</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`;
  zip.addFile('content.opf', Buffer.from(contentOpf));

  // Add chapter
  const chapter1 = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 1</title></head>
<body><h1>Chapter 1</h1><p>This is a test EPUB file without DRM protection.</p></body>
</html>`;
  zip.addFile('chapter1.xhtml', Buffer.from(chapter1));

  await fs.writeFile(path.join(testDir, 'valid-book.epub'), zip.toBuffer());

  // Create DRM EPUB
  const drmZip = new AdmZip();
  drmZip.addFile('mimetype', Buffer.from('application/epub+zip'), '', 0);
  drmZip.addFile('META-INF/container.xml', Buffer.from(containerXml));

  // Add encryption.xml
  const encryptionXml = `<?xml version="1.0" encoding="UTF-8"?>
<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <EncryptedData>
    <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/>
    <CipherData><CipherReference URI="content.opf"/></CipherData>
  </EncryptedData>
</encryption>`;
  drmZip.addFile('META-INF/encryption.xml', Buffer.from(encryptionXml));
  drmZip.addFile('content.opf', Buffer.from('ENCRYPTED_CONTENT'));

  await fs.writeFile(path.join(testDir, 'drm-protected.epub'), drmZip.toBuffer());

  // Create invalid file
  await fs.writeFile(path.join(testDir, 'invalid.epub'), 'This is not a valid EPUB file');

  console.log('EPUB test files created');
}

createEPUBTestFiles().catch(console.error);
