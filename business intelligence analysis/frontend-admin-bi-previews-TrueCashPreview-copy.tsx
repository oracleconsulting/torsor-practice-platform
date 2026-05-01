
interface TrueCashPreviewProps {
  bankBalance: number;
  trueCash: number;
  deductions: Array<{
    label: string;
    amount: number;
  }>;
}

export function TrueCashPreview({ bankBalance, trueCash, deductions }: TrueCashPreviewProps) {
  const formatCurrency = (amount: number) => {
    const prefix = amount >= 0 ? '' : '-';
    return `${prefix}£${Math.abs(amount).toLocaleString()}`;
  };
  
  const difference = bankBalance - trueCash;
  
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h4 className="font-semibold text-lg mb-4 text-gray-900">True Cash vs Bank Balance</h4>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-lg">
          <span className="text-gray-600">What your bank says:</span>
          <span className="font-bold text-green-600">{formatCurrency(bankBalance)}</span>
        </div>
        
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <p className="text-sm text-gray-500 font-medium">What you can actually spend:</p>
          {deductions.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm pl-4">
              <span className="text-gray-600">{item.label}</span>
              <span className={item.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center text-xl font-bold">
          <span className="text-gray-900">TRUE CASH:</span>
          <span className="text-blue-600">{formatCurrency(trueCash)}</span>
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            The <span className="font-semibold">{formatCurrency(difference)}</span> difference is money you can see but can't touch.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TrueCashPreview;

