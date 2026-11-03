/* 极简 xlsx 生成器：不依赖任何第三方库，直接拼 OOXML + ZIP(STORE)
 * 用法：XlsxLite.build({ sheetName:'清洗结果', headerStyle:true, rows:[[...],[...]] }) -> Blob
 */
(function (root, factory) {
  var lib = factory();
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.XlsxLite = lib;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /* ---------- CRC32 ---------- */
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code < 0x80) out.push(code);
      else if (code < 0x800) out.push(0xC0 | (code >> 6), 0x80 | (code & 63));
      else out.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    }
    return new Uint8Array(out);
  }

  function escXml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  }

  function colName(index) {
    var s = '';
    var n = index;
    do {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return s;
  }

  /* ---------- ZIP（仅 STORE，无压缩） ---------- */
  function buildZip(entries) {
    var now = new Date();
    var dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    var dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

    var local = [];
    var central = [];
    var offset = 0;

    entries.forEach(function (e) {
      var nameBytes = utf8(e.name);
      var data = e.data;
      var crc = crc32(data);
      var size = data.length;

      var lh = []
        .concat([0x50, 0x4B, 0x03, 0x04])
        .concat([20, 0])                    // version needed
        .concat([0x00, 0x08])               // flags: UTF-8
        .concat([0, 0])                     // method: store
        .concat([dosTime & 0xFF, dosTime >> 8])
        .concat([dosDate & 0xFF, dosDate >> 8])
        .concat([crc & 0xFF, (crc >>> 8) & 0xFF, (crc >>> 16) & 0xFF, (crc >>> 24) & 0xFF])
        .concat([size & 0xFF, (size >>> 8) & 0xFF, (size >>> 16) & 0xFF, (size >>> 24) & 0xFF])
        .concat([size & 0xFF, (size >>> 8) & 0xFF, (size >>> 16) & 0xFF, (size >>> 24) & 0xFF])
        .concat([nameBytes.length & 0xFF, nameBytes.length >> 8])
        .concat([0, 0]);

      var localHeader = new Uint8Array(lh);
      local.push(localHeader, nameBytes, data);

      var ch = []
        .concat([0x50, 0x4B, 0x01, 0x02])
        .concat([20, 0])                    // version made by
        .concat([20, 0])                    // version needed
        .concat([0x00, 0x08])
        .concat([0, 0])
        .concat([dosTime & 0xFF, dosTime >> 8])
        .concat([dosDate & 0xFF, dosDate >> 8])
        .concat([crc & 0xFF, (crc >>> 8) & 0xFF, (crc >>> 16) & 0xFF, (crc >>> 24) & 0xFF])
        .concat([size & 0xFF, (size >>> 8) & 0xFF, (size >>> 16) & 0xFF, (size >>> 24) & 0xFF])
        .concat([size & 0xFF, (size >>> 8) & 0xFF, (size >>> 16) & 0xFF, (size >>> 24) & 0xFF])
        .concat([nameBytes.length & 0xFF, nameBytes.length >> 8])
        .concat([0, 0, 0, 0])               // extra len + comment len
        .concat([0, 0])                     // disk number start
        .concat([0, 0, 0, 0, 0, 0])         // internal attrs(2) + external attrs(4)
        .concat([offset & 0xFF, (offset >>> 8) & 0xFF, (offset >>> 16) & 0xFF, (offset >>> 24) & 0xFF]);

      central.push(new Uint8Array(ch), nameBytes);
      offset += localHeader.length + nameBytes.length + size;
    });

    var centralSize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var eocd = new Uint8Array([]
      .concat([0x50, 0x4B, 0x05, 0x06])
      .concat([0, 0, 0, 0])
      .concat([entries.length & 0xFF, entries.length >> 8])
      .concat([entries.length & 0xFF, entries.length >> 8])
      .concat([centralSize & 0xFF, (centralSize >>> 8) & 0xFF, (centralSize >>> 16) & 0xFF, (centralSize >>> 24) & 0xFF])
      .concat([offset & 0xFF, (offset >>> 8) & 0xFF, (offset >>> 16) & 0xFF, (offset >>> 24) & 0xFF])
      .concat([0, 0]));

    var all = local.concat(central, [eocd]);
    var total = all.reduce(function (a, b) { return a + b.length; }, 0);
    var out = new Uint8Array(total);
    var pos = 0;
    all.forEach(function (part) { out.set(part, pos); pos += part.length; });
    return out;
  }

  /* ---------- OOXML ---------- */
  var XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  function sheetXml(rows, withHeaderStyle) {
    var cols = 4;
    var body = '';
    rows.forEach(function (row, r) {
      var cells = '';
      row.forEach(function (val, c) {
        var ref = colName(c) + (r + 1);
        if (val === null || val === undefined || val === '') {
          cells += '<c r="' + ref + '"' + (r === 0 && withHeaderStyle ? ' s="1"' : '') + '/>';
        } else if (typeof val === 'number' && isFinite(val)) {
          cells += '<c r="' + ref + '"' + (r === 0 && withHeaderStyle ? ' s="1"' : '') + '><v>' + val + '</v></c>';
        } else {
          cells += '<c r="' + ref + '" t="inlineStr"' + (r === 0 && withHeaderStyle ? ' s="1"' : '') +
            '><is><t xml:space="preserve">' + escXml(val) + '</t></is></c>';
        }
      });
      body += '<row r="' + (r + 1) + '">' + cells + '</row>';
    });

    var widths = '';
    for (var i = 0; i < cols; i++) {
      widths += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (i === 0 ? 22 : 16) + '" customWidth="1"/>';
    }

    return XML_HEAD +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<cols>' + widths + '</cols>' +
      '<sheetData>' + body + '</sheetData>' +
      '</worksheet>';
  }

  var STYLES_XML = XML_HEAD +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2">' +
    '<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>' +
    '</fonts>' +
    '<fills count="3">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF1FF"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="2">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  function build(opts) {
    var rows = opts.rows || [];
    var sheetName = (opts.sheetName || 'Sheet1').replace(/[\\\/\?\*\[\]:]/g, '').slice(0, 31);

    var entries = [
      {
        name: '[Content_Types].xml',
        data: utf8(XML_HEAD +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          '</Types>')
      },
      {
        name: '_rels/.rels',
        data: utf8(XML_HEAD +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          '</Relationships>')
      },
      {
        name: 'xl/workbook.xml',
        data: utf8(XML_HEAD +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
          'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<sheets><sheet name="' + escXml(sheetName) + '" sheetId="1" r:id="rId1"/></sheets>' +
          '</workbook>')
      },
      {
        name: 'xl/_rels/workbook.xml.rels',
        data: utf8(XML_HEAD +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
          '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
          '</Relationships>')
      },
      { name: 'xl/styles.xml', data: utf8(STYLES_XML) },
      { name: 'xl/worksheets/sheet1.xml', data: utf8(sheetXml(rows, opts.headerStyle !== false)) }
    ];

    var bytes = buildZip(entries);
    if (typeof Blob !== 'undefined') {
      return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    return bytes;
  }

  return { build: build, buildZip: buildZip };
});
