const { getSetting, setSetting } = require('../db/models');

/**
 * Schema-driven editable text content for marketing pages. Each page has a list of
 * field groups; each field's `default` is the original hardcoded copy, so pages render
 * unchanged until an admin edits them via /admin/noi-dung.
 */
const PAGE_CONTENT = {
  home: {
    label: 'Trang chủ',
    groups: [
      {
        title: 'Banner đầu trang',
        fields: [
          { key: 'heroBadge', label: 'Nhãn nhỏ', type: 'text', default: 'Phong cách mori · độc bản' },
          { key: 'heroTitleLine1', label: 'Tiêu đề (dòng 1)', type: 'text', default: 'Những chiếc váy cũ,' },
          { key: 'heroTitleEmphasis', label: 'Tiêu đề (dòng 2, nhấn mạnh)', type: 'text', default: 'tâm hồn mới.' },
          { key: 'heroDesc', label: 'Mô tả', type: 'textarea', default: 'teo.mhrift tuyển chọn váy secondhand cao cấp cho cô gái trẻ, tự nhiên và có cá tính riêng. Mỗi chiếc chỉ có một — khi hết là hết.' },
          { key: 'heroCtaPrimary', label: 'Nút chính', type: 'text', default: 'Khám phá bộ sưu tập' },
          { key: 'heroCtaSecondary', label: 'Nút phụ', type: 'text', default: 'Câu chuyện của chúng tôi' },
        ],
      },
      {
        title: 'Vì sao chọn chúng tôi (3 mục)',
        fields: [
          { key: 'usp1Title', label: 'Mục 1 — tiêu đề', type: 'text', default: 'Tuyển chọn kỹ lưỡng' },
          { key: 'usp1Desc', label: 'Mục 1 — mô tả', type: 'textarea', default: 'Từng chiếc váy được kiểm tra chất liệu, đường may và tình trạng trước khi lên kệ.' },
          { key: 'usp2Title', label: 'Mục 2 — tiêu đề', type: 'text', default: 'Độc bản, không đụng hàng' },
          { key: 'usp2Desc', label: 'Mục 2 — mô tả', type: 'textarea', default: 'Mỗi sản phẩm chỉ có đúng một chiếc — khi bạn thích, hãy đặt trước ngay.' },
          { key: 'usp3Title', label: 'Mục 3 — tiêu đề', type: 'text', default: 'Thời trang bền vững' },
          { key: 'usp3Desc', label: 'Mục 3 — mô tả', type: 'textarea', default: 'Chọn đồ cũ là chọn một lối sống chậm lại và yêu thương môi trường hơn.' },
        ],
      },
      {
        title: 'Sản phẩm nổi bật',
        fields: [
          { key: 'featuredEyebrow', label: 'Nhãn nhỏ', type: 'text', default: 'Vừa lên kệ' },
          { key: 'featuredTitle', label: 'Tiêu đề', type: 'text', default: 'Bộ sưu tập nổi bật' },
        ],
      },
      {
        title: 'Ảnh lớn tạo điểm nhấn (hook)',
        fields: [
          { key: 'hookEyebrow', label: 'Nhãn nhỏ', type: 'text', default: 'teo.mhrift' },
          { key: 'hookTitle', label: 'Tiêu đề lớn', type: 'text', default: 'Đồ cũ, tâm hồn mới.' },
          { key: 'hookDesc', label: 'Mô tả', type: 'textarea', default: 'Mỗi tuần một vài chiếc váy mới được tuyển chọn — khi hết là hết, không có chiếc thứ hai.' },
          { key: 'hookCta', label: 'Nút', type: 'text', default: 'Khám phá ngay' },
          { key: 'hookImage', label: 'Ảnh nền lớn', type: 'image', default: null },
        ],
      },
      {
        title: 'Đã từng thuộc về ai đó (sản phẩm đã bán)',
        fields: [
          { key: 'soldEyebrow', label: 'Nhãn nhỏ', type: 'text', default: 'Đã tìm được chủ nhân mới' },
          { key: 'soldTitle', label: 'Tiêu đề', type: 'text', default: 'Đã từng thuộc về ai đó' },
          { key: 'soldDesc', label: 'Mô tả', type: 'textarea', default: 'Một vài chiếc váy đã được các bạn rước về nhà — minh chứng rằng đồ tốt luôn có người thương.' },
        ],
      },
      {
        title: 'Câu chuyện thương hiệu (đoạn giới thiệu)',
        fields: [
          { key: 'storyTitle', label: 'Tiêu đề', type: 'text', default: 'Sống chậm lại, mặc đẹp hơn' },
          { key: 'storyBody', label: 'Nội dung', type: 'textarea', default: '"Mori" trong tiếng Nhật nghĩa là khu rừng — teo.mhrift lấy cảm hứng từ vẻ đẹp tự nhiên, mộc mạc và tinh thần sống chậm ấy. Chúng mình tin rằng một chiếc váy cũ, khi được yêu thương đúng người, sẽ đẹp hơn bất kỳ món đồ mới nào.' },
          { key: 'storyCta', label: 'Nút', type: 'text', default: 'Đọc câu chuyện của chúng tôi' },
        ],
      },
      {
        title: 'Câu chuyện & cảm hứng (bài viết mới nhất)',
        fields: [
          { key: 'journalEyebrow', label: 'Nhãn nhỏ', type: 'text', default: 'Nhật ký' },
          { key: 'journalTitle', label: 'Tiêu đề', type: 'text', default: 'Câu chuyện & cảm hứng' },
        ],
      },
      {
        title: 'Đăng ký nhận tin',
        fields: [
          { key: 'newsletterTitle', label: 'Tiêu đề', type: 'text', default: 'Đừng bỏ lỡ những chiếc váy mới' },
          { key: 'newsletterDesc', label: 'Mô tả', type: 'textarea', default: 'Đăng ký để nhận thông báo khi có sản phẩm mới — mỗi item chỉ có một chiếc duy nhất.' },
        ],
      },
      {
        title: 'Ảnh minh họa',
        fields: [
          { key: 'heroImage', label: 'Ảnh lớn', type: 'image', default: null },
          { key: 'heroImage2', label: 'Ảnh nhỏ nổi', type: 'image', default: null },
        ],
      },
    ],
  },

  about: {
    label: 'Về chúng tôi',
    groups: [
      {
        title: 'Banner đầu trang',
        fields: [
          { key: 'heroBadge', label: 'Nhãn nhỏ', type: 'text', default: 'Câu chuyện của chúng tôi' },
          { key: 'heroTitle', label: 'Tiêu đề', type: 'text', default: 'Về teo.mhrift' },
          { key: 'heroDesc', label: 'Mô tả', type: 'textarea', default: 'teo.mhrift ra đời từ tình yêu với những chiếc váy đã có một đời sống riêng — và niềm tin rằng thời trang đẹp không cần phải mới hoàn toàn.' },
        ],
      },
      {
        title: 'Ảnh minh họa',
        fields: [{ key: 'heroImage', label: 'Ảnh banner', type: 'image', default: null }],
      },
      {
        title: 'Mục 1',
        fields: [
          { key: 'block1Title', label: 'Tiêu đề', type: 'text', default: 'Vì sao lại là "mori"?' },
          { key: 'block1Body', label: 'Nội dung', type: 'textarea', default: 'Mori kei — nghĩa là "cô gái rừng" — là một tinh thần thời trang Nhật Bản: mộc mạc, tự nhiên, gần gũi với thiên nhiên. Đó cũng chính là điều teo.mhrift muốn mang đến — không phải sự hoàn hảo bóng bẩy, mà là vẻ đẹp có chiều sâu, có câu chuyện, có thời gian.' },
        ],
      },
      {
        title: 'Mục 2',
        fields: [
          { key: 'block2Title', label: 'Tiêu đề', type: 'text', default: 'Mỗi chiếc váy, một câu chuyện' },
          { key: 'block2Body', label: 'Nội dung', type: 'textarea', default: 'Chúng mình tìm kiếm những chiếc váy chất lượng cao đã qua sử dụng — từ các thương hiệu được yêu thích — kiểm tra kỹ từng đường kim mũi chỉ, đo đạc số thật, và ghi chú trung thực mọi dấu vết thời gian. Vì mỗi chiếc chỉ có một, khi bạn chọn một chiếc váy ở đây, bạn đang chọn một điều thực sự riêng biệt.' },
        ],
      },
      {
        title: 'Mục 3',
        fields: [
          { key: 'block3Title', label: 'Tiêu đề', type: 'text', default: 'Dành cho ai?' },
          { key: 'block3Body', label: 'Nội dung', type: 'textarea', default: 'teo.mhrift dành cho những cô gái trẻ, có cá tính riêng, không ngại khác biệt — những người tin rằng phong cách thật sự đến từ sự lựa chọn có ý thức, không phải từ số lượng.' },
        ],
      },
      {
        title: 'Mục 4',
        fields: [
          { key: 'block4Title', label: 'Tiêu đề', type: 'text', default: 'Chỉ bán online' },
          { key: 'block4Body', label: 'Nội dung', type: 'textarea', default: 'teo.mhrift không có cửa hàng offline — toàn bộ trải nghiệm mua sắm diễn ra tại đây, được chăm chút tỉ mỉ từ hình ảnh, mô tả đến từng bước đặt hàng, để bạn luôn an tâm khi chọn đồ secondhand online.' },
        ],
      },
      {
        title: 'Lời kêu gọi cuối trang',
        fields: [
          { key: 'ctaTitle', label: 'Tiêu đề', type: 'text', default: 'Sẵn sàng tìm chiếc váy của riêng bạn?' },
          { key: 'ctaButton', label: 'Nút', type: 'text', default: 'Khám phá cửa hàng' },
        ],
      },
    ],
  },

  faq: {
    label: 'Câu hỏi thường gặp',
    groups: [
      {
        title: 'Tiêu đề trang',
        fields: [{ key: 'title', label: 'Tiêu đề', type: 'text', default: 'Câu hỏi thường gặp' }],
      },
      {
        title: 'Câu hỏi 1',
        fields: [
          { key: 'q1', label: 'Câu hỏi', type: 'text', default: 'teo.mhrift có cửa hàng offline không?' },
          { key: 'a1', label: 'Trả lời', type: 'textarea', default: 'Không, teo.mhrift chỉ bán online. Toàn bộ trải nghiệm từ xem hàng, tư vấn đến đặt hàng đều diễn ra trên website và qua Zalo/Instagram.' },
        ],
      },
      {
        title: 'Câu hỏi 2',
        fields: [
          { key: 'q2', label: 'Câu hỏi', type: 'text', default: 'Làm sao để đặt một chiếc váy?' },
          { key: 'a2', label: 'Trả lời', type: 'textarea', default: 'Thêm sản phẩm vào giỏ hàng, sau đó vào mục "Đặt hàng" để điền thông tin. Vì hàng độc bản, đơn của bạn sẽ ở trạng thái "chờ xác nhận" cho đến khi shop liên hệ xác nhận thanh toán.' },
        ],
      },
      {
        title: 'Câu hỏi 3',
        fields: [
          { key: 'q3', label: 'Câu hỏi', type: 'text', default: 'Tôi có thể thanh toán bằng cách nào?' },
          { key: 'a3', label: 'Trả lời', type: 'textarea', default: 'Hiện tại teo.mhrift nhận chuyển khoản ngân hàng hoặc thanh toán khi nhận hàng (COD) tại các khu vực nội thành. Cổng thanh toán online (VNPay/Momo) sẽ sớm ra mắt.' },
        ],
      },
      {
        title: 'Câu hỏi 4',
        fields: [
          { key: 'q4', label: 'Câu hỏi', type: 'text', default: 'Sản phẩm có thực sự chỉ có một chiếc?' },
          { key: 'a4', label: 'Trả lời', type: 'textarea', default: 'Đúng vậy — đây là điểm đặc biệt của thời trang secondhand. Khi một sản phẩm được đặt, nó sẽ chuyển sang trạng thái "đang giữ chỗ" và không còn hiển thị để người khác đặt mua.' },
        ],
      },
      {
        title: 'Câu hỏi 5',
        fields: [
          { key: 'q5', label: 'Câu hỏi', type: 'text', default: 'Làm sao biết tình trạng thật của váy?' },
          { key: 'a5', label: 'Trả lời', type: 'textarea', default: 'Mỗi sản phẩm đều có ghi chú trung thực về tình trạng (thang điểm Như mới / Rất tốt / Tốt) kèm mô tả chi tiết nếu có vết mờ, lỗi nhỏ.' },
        ],
      },
      {
        title: 'Câu hỏi 6',
        fields: [
          { key: 'q6', label: 'Câu hỏi', type: 'text', default: 'Tôi có thể đổi trả nếu không hợp size không?' },
          { key: 'a6', label: 'Trả lời', type: 'textarea', default: 'teo.mhrift khuyến khích bạn đối chiếu kỹ số đo thật trước khi đặt. Đổi trả chỉ áp dụng khi sản phẩm thực tế khác đáng kể so với mô tả — xem chi tiết tại trang Chính sách đổi trả.' },
        ],
      },
      {
        title: 'Lời kêu gọi cuối trang',
        fields: [
          { key: 'ctaText', label: 'Dòng chữ', type: 'text', default: 'Vẫn còn thắc mắc?' },
          { key: 'ctaButton', label: 'Nút', type: 'text', default: 'Liên hệ với chúng tôi' },
        ],
      },
    ],
  },

  policy: {
    label: 'Chính sách',
    groups: [
      {
        title: 'Tiêu đề trang',
        fields: [{ key: 'title', label: 'Tiêu đề', type: 'text', default: 'Chính sách đổi trả & vận chuyển' }],
      },
      {
        title: 'Mục 1 — Vận chuyển',
        fields: [
          { key: 'section1Title', label: 'Tiêu đề', type: 'text', default: 'Vận chuyển' },
          { key: 'section1Body', label: 'Nội dung', type: 'textarea', default: 'teo.mhrift giao hàng toàn quốc qua đơn vị vận chuyển uy tín, thời gian dự kiến 2–5 ngày tùy khu vực. Phí vận chuyển được thông báo rõ khi shop xác nhận đơn hàng.' },
        ],
      },
      {
        title: 'Mục 2 — Kiểm tra hàng khi nhận',
        fields: [
          { key: 'section2Title', label: 'Tiêu đề', type: 'text', default: 'Kiểm tra hàng khi nhận' },
          { key: 'section2Body', label: 'Nội dung', type: 'textarea', default: 'Bạn được đồng kiểm cùng shipper trước khi thanh toán (đối với COD). Vui lòng kiểm tra đúng mẫu mã, tình trạng đã mô tả trên website trước khi nhận hàng.' },
        ],
      },
      {
        title: 'Mục 3 — Đổi trả',
        fields: [
          { key: 'section3Title', label: 'Tiêu đề', type: 'text', default: 'Đổi trả' },
          { key: 'section3Body', label: 'Nội dung', type: 'textarea', default: 'Vì là hàng secondhand độc bản, teo.mhrift chỉ hỗ trợ đổi trả trong vòng 24 giờ kể từ khi nhận hàng nếu sản phẩm thực tế không đúng như mô tả (khác đáng kể so với ảnh, số đo hoặc ghi chú tình trạng). Vui lòng giữ nguyên nhãn mác và không giặt/ủi trước khi liên hệ đổi trả.\n\nChúng mình không hỗ trợ đổi trả vì lý do "không hợp" hoặc "đổi ý" — vì vậy hãy đọc kỹ số đo và hình ảnh, hoặc liên hệ tư vấn trước khi đặt hàng nhé.' },
        ],
      },
      {
        title: 'Mục 4 — Hoàn tiền',
        fields: [
          { key: 'section4Title', label: 'Tiêu đề', type: 'text', default: 'Hoàn tiền' },
          { key: 'section4Body', label: 'Nội dung', type: 'textarea', default: 'Sau khi yêu cầu đổi trả hợp lệ được xác nhận, teo.mhrift hoàn tiền trong vòng 3–5 ngày làm việc qua chuyển khoản ngân hàng.' },
        ],
      },
    ],
  },

  sizeGuide: {
    label: 'Hướng dẫn chọn size',
    groups: [
      {
        title: 'Tiêu đề trang',
        fields: [
          { key: 'title', label: 'Tiêu đề', type: 'text', default: 'Hướng dẫn chọn size' },
          { key: 'intro', label: 'Mô tả', type: 'textarea', default: 'Vì mỗi món đồ là hàng secondhand độc bản, form dáng có thể khác đôi chút so với size mới tinh. Hãy luôn dựa vào số đo thật ghi trên từng sản phẩm thay vì chỉ nhìn nhãn size.' },
        ],
      },
      {
        title: 'Bảng số đo (cm)',
        fields: [
          { key: 'xsChest', label: 'XS — Vòng ngực', type: 'text', default: '78–80' },
          { key: 'xsWaist', label: 'XS — Vòng eo', type: 'text', default: '60–62' },
          { key: 'xsHip', label: 'XS — Vòng hông', type: 'text', default: '86–88' },
          { key: 'sChest', label: 'S — Vòng ngực', type: 'text', default: '81–84' },
          { key: 'sWaist', label: 'S — Vòng eo', type: 'text', default: '63–66' },
          { key: 'sHip', label: 'S — Vòng hông', type: 'text', default: '89–92' },
          { key: 'mChest', label: 'M — Vòng ngực', type: 'text', default: '85–88' },
          { key: 'mWaist', label: 'M — Vòng eo', type: 'text', default: '67–70' },
          { key: 'mHip', label: 'M — Vòng hông', type: 'text', default: '93–96' },
          { key: 'lChest', label: 'L — Vòng ngực', type: 'text', default: '89–93' },
          { key: 'lWaist', label: 'L — Vòng eo', type: 'text', default: '71–75' },
          { key: 'lHip', label: 'L — Vòng hông', type: 'text', default: '97–101' },
          { key: 'xlChest', label: 'XL — Vòng ngực', type: 'text', default: '94–98' },
          { key: 'xlWaist', label: 'XL — Vòng eo', type: 'text', default: '76–80' },
          { key: 'xlHip', label: 'XL — Vòng hông', type: 'text', default: '102–106' },
        ],
      },
      {
        title: 'Cách đo tại nhà',
        fields: [
          { key: 'measureTitle', label: 'Tiêu đề', type: 'text', default: 'Cách đo tại nhà' },
          { key: 'measure1', label: 'Gạch đầu dòng 1', type: 'text', default: 'Vòng ngực: đo quanh phần đầy nhất của ngực.' },
          { key: 'measure2', label: 'Gạch đầu dòng 2', type: 'text', default: 'Vòng eo: đo quanh phần nhỏ nhất của eo.' },
          { key: 'measure3', label: 'Gạch đầu dòng 3', type: 'text', default: 'Vòng hông: đo quanh phần đầy nhất của hông.' },
          { key: 'measure4', label: 'Gạch đầu dòng 4', type: 'text', default: 'Nên đo khi mặc đồ lót mỏng, thước dây ôm sát nhưng không siết chặt.' },
        ],
      },
      {
        title: 'Còn phân vân?',
        fields: [
          { key: 'adviceTitle', label: 'Tiêu đề', type: 'text', default: 'Còn phân vân?' },
          { key: 'adviceBody', label: 'Nội dung', type: 'textarea', default: 'Nhắn cho shop số đo của bạn, teo.mhrift sẽ tư vấn chiếc váy phù hợp nhất trong bộ sưu tập hiện có.' },
          { key: 'adviceButton', label: 'Nút', type: 'text', default: 'Liên hệ tư vấn' },
        ],
      },
    ],
  },

  contact: {
    label: 'Liên hệ',
    groups: [
      {
        title: 'Tiêu đề trang',
        fields: [
          { key: 'title', label: 'Tiêu đề', type: 'text', default: 'Liên hệ' },
          { key: 'intro', label: 'Mô tả', type: 'textarea', default: 'Có câu hỏi về sản phẩm, số đo hay đơn hàng? Nhắn cho teo.mhrift, mình phản hồi trong vòng 24 giờ.' },
        ],
      },
    ],
  },

  footer: {
    label: 'Chân trang',
    groups: [
      {
        title: 'Chân trang (hiển thị ở mọi trang)',
        fields: [
          { key: 'tagline', label: 'Giới thiệu ngắn', type: 'textarea', default: 'Váy secondhand cao cấp, tuyển chọn kỹ lưỡng — mỗi chiếc váy là một câu chuyện riêng. Chỉ bán online.' },
          { key: 'copyright', label: 'Dòng bản quyền (sau "© {năm} teo.mhrift.")', type: 'text', default: 'Yêu thương từng chiếc váy cũ, trân trọng từng câu chuyện.' },
        ],
      },
    ],
  },
};

function fieldsOf(page) {
  return PAGE_CONTENT[page].groups.flatMap((g) => g.fields);
}

async function getPageContent(page) {
  const schema = PAGE_CONTENT[page];
  if (!schema) return {};
  const saved = JSON.parse((await getSetting(`content:${page}`, '{}')) || '{}');
  const result = {};
  fieldsOf(page).forEach((f) => {
    result[f.key] = saved[f.key] !== undefined && saved[f.key] !== '' ? saved[f.key] : f.default;
  });
  return result;
}

async function getAllPageContent() {
  const result = {};
  for (const page of Object.keys(PAGE_CONTENT)) {
    result[page] = await getPageContent(page);
  }
  return result;
}

async function savePageContent(page, body) {
  const schema = PAGE_CONTENT[page];
  if (!schema) return;
  const saved = JSON.parse((await getSetting(`content:${page}`, '{}')) || '{}');
  const data = {};
  fieldsOf(page).forEach((f) => {
    // Image fields aren't part of the text form — leave whatever was uploaded via the inline editor untouched.
    data[f.key] = f.type === 'image' ? (saved[f.key] !== undefined ? saved[f.key] : null) : (body[f.key] || '').trim();
  });
  await setSetting(`content:${page}`, JSON.stringify(data));
}

/** Updates a single field (used by the inline click-to-edit UI on the live pages). Returns false if page/key is unknown. */
async function updatePageContentField(page, key, value) {
  const schema = PAGE_CONTENT[page];
  if (!schema) return false;
  if (!fieldsOf(page).some((f) => f.key === key)) return false;
  const saved = JSON.parse((await getSetting(`content:${page}`, '{}')) || '{}');
  saved[key] = value;
  await setSetting(`content:${page}`, JSON.stringify(saved));
  return true;
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Renders a text field so it's plain text for visitors, but click-to-edit for a logged-in
 * admin (used on the live public pages instead of a separate admin form). `multiline`
 * allows Enter to insert line breaks (paragraphs); otherwise Enter saves and blurs.
 */
function editableText(isAdmin, page, key, value, { multiline = false } = {}) {
  // Always a <span> (never a block tag) so this can be dropped inside an existing <p>/<h1>/etc.
  // without breaking HTML nesting; multi-line values use <br> instead of block boxes.
  const safe = escapeHtml(value).replace(/\n/g, '<br>');
  if (!isAdmin) return `<span>${safe}</span>`;
  return `<span class="js-edit-text" data-page="${page}" data-key="${key}" data-multiline="${multiline ? '1' : '0'}">${safe}</span>`;
}

module.exports = {
  PAGE_CONTENT,
  getPageContent,
  getAllPageContent,
  savePageContent,
  updatePageContentField,
  editableText,
};
