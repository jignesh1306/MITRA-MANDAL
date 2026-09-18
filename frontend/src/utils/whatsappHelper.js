/**
 * WhatsApp Gujarati statement generator for Mitra-Mandal
 */
const GUJARATI_MONTHS = [
  '',
  'જાન્યુઆરી',
  'ફેબ્રુઆરી',
  'માર્ચ',
  'એપ્રિલ',
  'મે',
  'જૂન',
  'જુલાઈ',
  'ઓગસ્ટ',
  'સપ્ટેમ્બર',
  'ઓક્ટોબર',
  'નવેમ્બર',
  'ડિસેમ્બર'
];

export const formatINR = (paiseOrRupee, isPaise = false) => {
  const val = isPaise ? Math.round(Number(paiseOrRupee || 0) / 100) : Math.round(Number(paiseOrRupee || 0));
  return '₹' + val.toLocaleString('en-IN');
};

export const generateMemberWhatsAppMessage = (member) => {
  if (!member) return '';

  const name = member.name || 'સભ્ય';
  const currentMonth = member.currentContribution?.month || (new Date().getMonth() + 1);
  const currentYear = member.currentContribution?.year || new Date().getFullYear();
  const monthNameGujarati = GUJARATI_MONTHS[currentMonth] || `મહિનો ${currentMonth}`;

  // Monthly Fund details
  const fundExpected = (member.currentContribution?.expectedAmount || 200000) / 100;
  const isFundPaid = member.currentContribution?.status === 'PAID';
  const fundStatusText = isFundPaid ? '✅ *ચૂકવેલ છે*' : '❌ *બાકી છે*';
  const fundDueAmount = isFundPaid ? 0 : fundExpected;

  // Loan details
  const loan = member.loanSummary?.hasActiveLoan ? member.loanSummary : null;
  let loanSection = '';
  let loanDueAmount = 0;

  if (loan) {
    const principal = Math.round((loan.principal || 0) / 100);
    const paidPrincipal = Math.round((loan.paidPrincipal || 0) / 100);
    const remainingPrincipal = Math.round((loan.remainingPrincipal || 0) / 100);
    const remainingInterest = Math.round((loan.remainingInterest || 0) / 100);
    const currentEMI = Math.round((loan.currentEMI || 0) / 100);

    loanDueAmount = currentEMI > 0 ? currentEMI : (remainingPrincipal > 0 ? Math.min(remainingPrincipal, 5000) : 0);

    loanSection = '━━━━━━━━━━━━━━━━━━\n' +
      '🏦 *લોન વિગત*\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      `📌 કુલ લોન: ${formatINR(principal)}\n` +
      `💸 ચૂકવેલ: ${formatINR(paidPrincipal)}\n` +
      `⏳ બાકી મુદ્દલ: ${formatINR(remainingPrincipal)}\n` +
      `📈 બાકી વ્યાજ: ${formatINR(remainingInterest)}\n` +
      (currentEMI > 0 ? `🔢 આ મહિને ભરવાનો EMI: ${formatINR(currentEMI)}\n` : '');
  }

  // Total Group Fund
  const groupBalance = Math.round((member.groupFundBalance || 0) / 100);

  // Total Due calculation (Fund due + Loan EMI due)
  const totalDue = fundDueAmount + loanDueAmount;

  let message = `🙏 નમસ્તે, *${name}*!\n\n` +
    `આ મિત્ર-મંડળ તરફથી તમારો *${monthNameGujarati} ${currentYear}* નો નાણાકીય અહેવાલ છે.\n\n` +
    '━━━━━━━━━━━━━━━━━━\n' +
    '💰 *માસિક ફંડ ફાળો*\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    `📅 મહિનો: ${monthNameGujarati} ${currentYear}\n` +
    `💵 નિયત રકમ: ${formatINR(fundExpected)}\n` +
    `📌 સ્થિતિ: ${fundStatusText}\n\n`;

  if (loanSection) {
    message += `${loanSection}\n`;
  }

  message += '━━━━━━━━━━━━━━━━━━\n' +
    '📊 *ગ્રુપ ફંડ સ્થિતિ*\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    `🏧 કુલ ગ્રુપ ફંડ બેલેન્સ: ${formatINR(groupBalance)}\n\n` +
    '━━━━━━━━━━━━━━━━━━\n';

  if (totalDue > 0) {
    message += `⚠️ *કુલ બાકી રકમ: ${formatINR(totalDue)}*\n` +
      (loanDueAmount > 0 
        ? `*(ફંડ ${formatINR(fundDueAmount)} + લોન EMI ${formatINR(loanDueAmount)})*\n\n` 
        : '*(માસિક ફંડ પેમેન્ટ બાકી છે)*\n\n') +
      'કૃપા કરીને સમયસર ચૂકવણી કરો. 🙏\n\n';
  } else {
    message += '🎉 *તમારું આ મહિનાનું બધું ચુકવણું પૂર્ણ થઈ ગયું છે! આભાર.* 👏\n\n';
  }

  message += 'કોઈ પ્રશ્ન હોય તો સંપર્ક કરો: *9428896132*\n\n' +
    '🌟 *મિત્ર-મંડળ — સાથે બચત, સાથે વિકાસ*';

  return message;
};

export const openWhatsApp = (phone, message) => {
  if (!phone) return;
  const cleanPhone = String(phone).replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
  window.open(url, '_blank');
};
