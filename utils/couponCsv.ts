export type CouponRow = { line: number; code: string; name: string; description: string; expiresAt: string | null };
export type CouponCsvResult = { rows: CouponRow[]; problems: { line: number; reason: string }[]; total: number };

export const COUPON_CSV_TEMPLATE =
  'code,company,description,expiry\nEGG-123-COUPON,Acme Foods,Jumia 20% Discount,2026-12-31\nEGG-456-COUPON,Acme Foods,Free delivery,31/12/2026\n';

/** Small CSV reader: quotes, escaped quotes, BOM, and comma / semicolon / tab separators. */
export function splitCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delim = [',', ';', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function toIsoDate(raw: string): string | null | undefined {
  const v = raw.trim();
  if (!v) return null; // blank = no expiry
  let y: number, m: number, d: number;
  let mt = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (mt) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  else if ((mt = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) { d = +mt[1]; m = +mt[2]; y = +mt[3]; } // day first
  else return undefined;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return undefined;
  return dt.toISOString();
}

const ALIASES = {
  code: ['code', 'coupon', 'couponcode', 'coupon code'],
  name: ['company', 'companyname', 'company name', 'name', 'brand'],
  description: ['description', 'desc', 'details'],
  expiry: ['expiry', 'expires', 'expiresat', 'expiry date', 'expirydate', 'expiration', 'expires at'],
};

export function parseCouponCsv(text: string): CouponCsvResult {
  const all = splitCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  const head = (all[0] ?? []).map((c) => c.trim().toLowerCase());
  const hasHeader = head.some((c) => ALIASES.code.includes(c));
  const find = (names: string[], fallback: number) => {
    if (!hasHeader) return fallback;
    const i = head.findIndex((c) => names.includes(c));
    return i === -1 ? fallback : i;
  };
  const ix = { code: find(ALIASES.code, 0), name: find(ALIASES.name, 1), description: find(ALIASES.description, 2), expiry: find(ALIASES.expiry, 3) };
  const body = hasHeader ? all.slice(1) : all;
  const rows: CouponRow[] = [];
  const problems: { line: number; reason: string }[] = [];
  const seen = new Set<string>();
  body.forEach((r, n) => {
    const line = n + 1 + (hasHeader ? 1 : 0);
    const code = (r[ix.code] ?? '').trim();
    const name = (r[ix.name] ?? '').trim();
    const description = (r[ix.description] ?? '').trim();
    const exp = toIsoDate(r[ix.expiry] ?? '');
    if (!code) return void problems.push({ line, reason: 'missing code' });
    if (!name) return void problems.push({ line, reason: `${code}: missing company` });
    if (!description) return void problems.push({ line, reason: `${code}: missing description` });
    if (exp === undefined) return void problems.push({ line, reason: `${code}: expiry must be YYYY-MM-DD or DD/MM/YYYY` });
    if (seen.has(code.toLowerCase())) return void problems.push({ line, reason: `${code}: duplicated in this file` });
    seen.add(code.toLowerCase());
    rows.push({ line, code, name, description, expiresAt: exp });
  });
  return { rows, problems, total: body.length };
}
