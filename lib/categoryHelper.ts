export function normalizeCategory(category: string): string {
  if (!category) return 'Khác';
  const c = category.toLowerCase().trim();

  // Lavabo
  if (c.includes('lavabo') && !c.includes('vòi') && !c.includes('tủ') && !c.includes('faucet')) return 'Lavabo';
  if (c.includes('chậu rửa') && !c.includes('vòi')) return 'Lavabo';
  if (c === 'basin' || c === 'washbasin') return 'Lavabo';

  // Vòi lavabo
  if ((c.includes('vòi') && c.includes('lavabo')) || c.includes('vòi rửa') || c.includes('vòi chậu')) return 'Vòi lavabo';
  if (c === 'faucet' || c === 'mixer') return 'Vòi lavabo';

  // Gương
  if (c.includes('gương') && !c.includes('đèn')) return 'Gương';
  if (c === 'mirror') return 'Gương';

  // Sen tắm
  if (c.includes('sen tắm') || c.includes('sen cây') || c.includes('bộ sen')) return 'Sen tắm';
  if (c.includes('shower')) return 'Sen tắm';

  // Bồn cầu
  if (c.includes('bồn cầu') || c === 'wc' || c === 'toilet') return 'Bồn cầu';

  // Gạch ốp
  if (c.includes('gạch')) return 'Gạch ốp';
  if (c.includes('tile')) return 'Gạch ốp';

  // Tủ lavabo
  if (c.includes('tủ lavabo') || c.includes('tủ chậu') || c.includes('vanity')) return 'Tủ lavabo';

  // Đèn
  if (c.includes('đèn') || c.includes('light')) return 'Đèn';

  // Phụ kiện
  if (c.includes('phụ kiện') || c.includes('kệ') || c.includes('thanh treo') || c.includes('accessory') || c.includes('accessories')) return 'Phụ kiện';

  // Sofa, Bàn, Ghế
  if (c.includes('sofa')) return 'Sofa';
  if (c.includes('bàn') || c.includes('table')) return 'Bàn';
  if (c.includes('ghế') || c.includes('chair')) return 'Ghế';

  // Default
  return category.trim(); // Fallback to raw category if no match
}
