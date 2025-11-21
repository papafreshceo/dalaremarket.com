export default function DepositChargePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="text-center">
        {/* 로고 */}
        <div className="mb-8">
          <img
            src="https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png"
            alt="달래마켓"
            className="mx-auto opacity-50"
            style={{ height: '80px' }}
          />
        </div>

        {/* 준비 중 메시지 */}
        <p className="text-xl text-gray-600">
          준비 중입니다
        </p>
      </div>
    </div>
  );
}
