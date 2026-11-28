import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "../../components/add-to-cart";
import { Icon } from "../../components/bloomie-icon";
import Storefront from "../../components/storefront";
import { getProducts } from "../../lib/products";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const productDetails: Record<string, {
  summary: string;
  specifications: [label: string, value: string][];
  description: string;
  activity: string[];
  care: string;
}> = {
  "ghep-hinh-logic": {
    summary: "Bé tìm hai bức hình có liên quan rồi ghép lại với nhau, như gà con với gà mẹ hay thỏ với cà rốt. Mỗi cặp có đường cắt riêng để bé tự thử và kiểm tra.",
    specifications: [
      ["Thương hiệu", "Bloomie"],
      ["Phù hợp với", "Trẻ cần hỗ trợ quan sát, tập trung và nhận ra mối liên hệ giữa các sự vật."],
      ["Trong hộp", "Các cặp hình ghép 2 mảnh, hộp đựng và cẩm nang gợi ý trò chơi cho ba mẹ."],
      ["Chủ đề", "Mẹ và con, con vật và thức ăn, đồ vật và công dụng, nghề nghiệp và dụng cụ, hình và bóng."],
      ["Kỹ năng thực hành", "Ghép cặp, phân loại, quan sát chi tiết, giải thích vì sao hai hình đi cùng nhau và gọi tên sự vật."],
    ],
    description: "Mỗi cặp hình là một câu chuyện ngắn để ba mẹ trò chuyện với con. Bé có thể nhìn hình, so sánh các mảnh và thử ghép. Khi hai mảnh vừa nhau, ba mẹ có thể cùng con gọi tên và nói về mối liên hệ giữa hai hình.",
    activity: [
      "Bày hình con thỏ, mảnh cà rốt và một mảnh khác. Hỏi “Thỏ ăn gì?” rồi cho con thời gian tìm mảnh cà rốt.",
      "Cùng con quan sát đường cắt và thử ghép hai mảnh. Nếu chưa khớp, cho con đổi mảnh và thử lại.",
      "Khi con đã quen, thêm vài cặp về đồ vật hoặc nghề nghiệp rồi cùng con giải thích vì sao hai hình đi cùng nhau.",
    ],
    care: "Lau bằng khăn khô hoặc hơi ẩm, tránh ngâm nước và tránh ánh nắng trực tiếp. Ba mẹ nên ở bên quan sát khi con chơi.",
  },
  "the-tu-vung": {
    summary: "100 thẻ ảnh thật về đồ vật, con vật và những điều quen thuộc quanh bé. Mỗi thẻ có từ tiếng Việt và câu gợi ý để ba mẹ trò chuyện cùng con.",
    specifications: [
      ["Thương hiệu", "Bloomie"],
      ["Phù hợp với", "Trẻ cần hỗ trợ hiểu từ, gọi tên sự vật và diễn đạt bằng câu ngắn."],
      ["Trong hộp", "100 thẻ, hộp đựng, vòng khoen để nhóm thẻ theo chủ đề và cẩm nang cho ba mẹ."],
      ["10 chủ đề", "Gia đình, con vật, đồ ăn, đồ dùng trong nhà, quần áo, cơ thể, phương tiện, màu sắc, hành động và cảm xúc."],
      ["Hai mặt thẻ", "Mặt trước là ảnh chụp thật trên nền trơn. Mặt sau in từ tiếng Việt bằng chữ thường cỡ lớn và có 1–2 câu gợi ý."],
      ["Chất liệu", "Giấy cứng cán màng, bo tròn bốn góc."],
      ["Kích thước mỗi thẻ", "8 × 6 cm"],
      ["Kỹ năng thực hành", "Hiểu từ, gọi tên, bắt chước âm thanh, nói câu ngắn và cùng ba mẹ tập trung vào một hình ảnh."],
    ],
    description: "Bộ thẻ dùng ảnh thật và gợi ý hỏi–đáp để ba mẹ trò chuyện cùng con về những điều quen thuộc. Con có thể bắt đầu bằng cách nhìn và chỉ đúng hình, rồi tập gọi tên, bắt chước âm thanh hoặc ghép từ thành câu ngắn khi đã sẵn sàng.",
    activity: [
      "Bày thẻ con chó và thẻ con mèo trước mặt con rồi hỏi “Đâu là con chó?”. Cho con thời gian nhìn và chỉ vào thẻ.",
      "Khi con chọn thẻ, ba mẹ có thể gọi tên con vật và cùng con bắt chước tiếng kêu. Nếu con đã quen gọi tên, thử nói một câu ngắn như “Chó sủa” hoặc “Mèo ăn”.",
      "Chọn vài thẻ thuộc chủ đề con thích và lặp lại trò chơi theo nhịp của con.",
    ],
    care: "Lau thẻ bằng khăn ẩm khi bẩn, tránh ngâm nước và cất lại vào hộp sau khi chơi để thẻ không bị cong.",
  },
  "bo-oc-van": {
    summary: "Bộ 20 cặp bu lông và đai ốc bằng nhựa PP có 4 hình khối và 5 màu. Bé có thể ghép cặp rồi tập giữ bằng một tay, xoay bằng tay còn lại.",
    specifications: [
      ["Thương hiệu", "Bloomie"],
      ["Phù hợp với", "Trẻ cần thực hành cầm nắm, xoay cổ tay hoặc phối hợp hai tay."],
      ["Trong bộ", "20 cặp bu lông và đai ốc, túi hoặc hộp đựng và cẩm nang cho ba mẹ."],
      ["Hình khối", "Tam giác, vuông, lục giác và tròn."],
      ["Màu sắc", "Đỏ, vàng, xanh dương, xanh lá và cam."],
      ["Chất liệu", "Nhựa PP, các góc bo tròn."],
      ["Kích thước", "Bu lông dài khoảng 5 cm, đai ốc rộng khoảng 3 cm."],
      ["Kỹ năng thực hành", "Cầm nắm, xoay cổ tay, phối hợp hai tay và tay–mắt, nhận biết hình và màu, đếm cặp."],
    ],
    description: "Bé tìm đai ốc cùng hình và màu với đầu bu lông rồi đưa hai chi tiết vào đúng vị trí. Hoạt động giúp bé thực hành phối hợp tay–mắt khi căn đai ốc, đồng thời luyện thao tác giữ và xoay bằng hai tay.",
    activity: [
      "Chọn một bu lông và để con tìm đai ốc cùng hình, cùng màu.",
      "Làm mẫu cách đặt đai ốc vào đầu bu lông. Để con thử giữ bu lông bằng một tay và xoay đai ốc bằng tay kia.",
      "Khi con đã quen, cùng con xếp các cặp theo hình hoặc màu rồi đếm xem đã ghép được bao nhiêu cặp.",
    ],
    care: "Ba mẹ giám sát khi con chơi và không để con ngậm các chi tiết. Rửa bằng nước ấm và xà phòng nhẹ, để khô trước khi cất.",
  },
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { products, error } = await getProducts();

  if (error) {
    return (
      <Storefront>
        <main className="mx-auto w-full max-w-[1200px] px-5 py-10 md:px-8">
          <p role="alert">{error}</p>
          <Link href="/san-pham" className="mt-6 inline-block underline">
            Quay lại sản phẩm
          </Link>
        </main>
      </Storefront>
    );
  }

  const product = products.find((item) => item.id === id);
  if (!product) notFound();
  const detail = Object.hasOwn(productDetails, product.id)
    ? productDetails[product.id]
    : undefined;

  return (
    <Storefront>
      <main className="mx-auto w-full max-w-[1200px] px-5 py-8 md:px-8 md:py-12">
        <Link
          href="/san-pham"
          className="inline-flex rounded-full border border-[#dce8d8] px-4 py-2 text-sm font-semibold text-[#245c45] hover:bg-[#e8f1dd]"
        >
          ← Tất cả sản phẩm
        </Link>

        <div className="mt-6 grid items-start gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
          <div className="rounded-[32px] border border-[#e4eddc] bg-[#f0f5e9] p-4 sm:p-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-white">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 767px) 90vw, (max-width: 1200px) 55vw, 640px"
                className="object-contain p-5 sm:p-8"
              />
              <a
                href={product.image}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mở ảnh sản phẩm trong tab mới"
                className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white text-[#245c45] shadow-sm hover:bg-[#e8f1dd]"
              >
                <Icon name="search" className="size-5" />
              </a>
            </div>
          </div>

          <section className="min-w-0">
            <p className="inline-flex rounded-full bg-[#e8f1dd] px-3 py-1 text-xs font-bold tracking-wide text-[#245c45]">
              BỘ HỌC LIỆU BLOOMIE
            </p>

            <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-[#1f3d33] lg:text-5xl">
              {" "}
              {product.name}
            </h1>

            <div className="mt-5 rounded-[24px] border border-[#dce8d8] bg-white px-5 py-4">
              <p className="text-xs font-semibold tracking-wide text-[#52645a]">
                GIÁ BÁN NIÊM YẾT
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#1f3d33]">
                {product.price_vnd === null
                  ? "Giá đang cập nhật"
                  : money.format(product.price_vnd)}
              </p>
            </div>

            <p className="mt-5 whitespace-pre-line text-base leading-7 text-[#4a5568]">
              {detail?.summary || product.description?.trim() ||
                "Thông tin chi tiết của bộ học liệu đang được cập nhật."}
            </p>

            <AddToCart key={product.id} productId={product.id} showQuantity />

            <p className="mt-5 flex items-start gap-2 rounded-2xl bg-[#edf4e7] px-4 py-3 text-sm leading-6 text-[#375347]">
              <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
              Bloomie sử dụng ví giả lập để thanh toán đơn hàng.
            </p>
          </section>
        </div>

        {detail && (
          <div className="mt-10 space-y-6">
            <section aria-labelledby="product-specifications" className="overflow-hidden rounded-3xl border border-[#dce8d8] bg-white">
              <h2 id="product-specifications" className="bg-[#e8f1dd] px-5 py-4 text-xl font-bold sm:px-6">
                Chi tiết sản phẩm
              </h2>
              <table aria-labelledby="product-specifications" className="w-full border-collapse text-left text-sm leading-6">
                <tbody className="divide-y divide-[#e4eddc]">
                  {detail.specifications.map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row" className="w-1/3 px-4 py-3 align-top font-semibold sm:w-1/4 sm:px-6">{label}</th>
                      <td className="px-4 py-3 align-top text-[#4a5568] sm:px-6">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section aria-labelledby="product-description" className="rounded-3xl border border-[#dce8d8] bg-white p-5 sm:p-6">
              <h2 id="product-description" className="text-xl font-bold">Mô tả sản phẩm</h2>
              <p className="mt-3 text-sm leading-6 text-[#4a5568]">{detail.description}</p>
              <h3 className="mt-4 font-semibold text-[#245c45]">Cách chơi cùng con</h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#4a5568]">
                {detail.activity.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <h3 className="mt-5 font-semibold text-[#245c45]">Bảo quản và lưu ý khi chơi</h3>
              <p className="mt-2 text-sm leading-6 text-[#4a5568]">{detail.care}</p>
            </section>
          </div>
        )}
      </main>
    </Storefront>
  );
}
