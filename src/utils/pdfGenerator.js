import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (globalStats, meals, purchases, goals) => {
  try {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(26, 115, 232); // Primary Blue
    doc.text('SMWallet Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    let currentY = 40;

    // Summary Table
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary', 14, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Total Balance', 'Total Spent', 'Remaining']],
      body: [[
        `${(globalStats?.totalBalance || 0).toFixed(2)} BDT`,
        `${(globalStats?.totalSpent || 0).toFixed(2)} BDT`,
        `${(globalStats?.totalRemaining || 0).toFixed(2)} BDT`
      ]],
      theme: 'striped',
      headStyles: { fillColor: [26, 115, 232] }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Goals Table
    if (goals && goals.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.text('Savings Goals', 14, currentY);
      
      const goalsData = goals.map(g => [
        g.name,
        `${g.savedAmount} BDT`,
        `${g.targetAmount} BDT`,
        `${Math.round((g.savedAmount / g.targetAmount) * 100)}%`
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Goal Name', 'Saved', 'Target', 'Progress']],
        body: goalsData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // Meals Table
    if (meals && meals.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.text('Meals History', 14, currentY);

      const mealsData = meals.map(m => [
        m.date,
        m.mealType,
        m.item,
        `${m.amount} BDT`,
        m.walletName
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Date', 'Type', 'Item', 'Amount', 'Wallet']],
        body: mealsData,
        theme: 'striped',
        headStyles: { fillColor: [26, 115, 232] }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // Purchases Table
    if (purchases && purchases.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.text('Purchases History', 14, currentY);

      const purchasesData = purchases.map(p => [
        p.date,
        p.category,
        p.item,
        `${p.amount} BDT`,
        p.walletName
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Date', 'Category', 'Item', 'Amount', 'Wallet']],
        body: purchasesData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] }
      });
    }

    doc.save('SMWallet_Report.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please check the console for errors.');
  }
};
