/**
 * Utility to send WhatsApp messages using the wa.me API
 */
export function sendWhatsAppMessage(phone: string, message: string) {
  // Clean phone number: remove non-numeric characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // If phone starts with 0 and doesn't have a +, it might be a local number.
  // Ideally, numbers should be in international format.
  // We'll assume the user provides a reasonably correct number or we'll just use it.
  
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
}

export function formatInvoiceMessage(inv: { no: string; customer: string; amount: string; currency: string; status: string }, lang: 'ar' | 'en'): string {
  const isRtl = lang === 'ar';
  const statusMap: Record<string, string> = {
    'paid': isRtl ? 'مدفوعة' : 'Paid',
    'unpaid': isRtl ? 'غير مدفوعة' : 'Unpaid',
    'partial': isRtl ? 'مدفوعة جزئياً' : 'Partially Paid'
  };

  const status = statusMap[inv.status] || inv.status;

  if (isRtl) {
    return `مرحباً ${inv.customer}،\nمرفق لكم تفاصيل الفاتورة رقم ${inv.no}.\nالمبلغ: ${inv.amount} ${inv.currency}\nالحالة: ${status}\nشكراً لتعاملكم معنا.`;
  }
  return `Hello ${inv.customer},\nHere are the details for invoice ${inv.no}.\nAmount: ${inv.amount} ${inv.currency}\nStatus: ${status}\nThank you for choosing us.`;
}

export function formatTaskMessage(task: { title: string; description: string; status: string; dueDate?: string }, lang: 'ar' | 'en'): string {
  const isRtl = lang === 'ar';
  const statusMap: Record<string, string> = {
    'todo': isRtl ? 'قيد الانتظار' : 'To Do',
    'in-progress': isRtl ? 'قيد التنفيذ' : 'In Progress',
    'completed': isRtl ? 'مكتملة' : 'Completed'
  };

  const status = statusMap[task.status] || task.status;
  const dateStr = task.dueDate ? `\n${isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}: ${task.dueDate}` : '';

  if (isRtl) {
    return `تحديث للمهمة: ${task.title}\nالوصف: ${task.description}\nالحالة: ${status}${dateStr}`;
  }
  return `Task Update: ${task.title}\nDescription: ${task.description}\nStatus: ${status}${dateStr}`;
}
