require('dotenv').config();
const slugify = require('slugify');
const { ensureDatabase, queryOne, run } = require('../config/db');

const sampleProducts = [
  {
    name: 'Đầm lụa hoa nhí Rosalie',
    category: 'Váy hoa nhí',
    brand: 'Sézane',
    size_label: 'S',
    measurements: 'Ngực 82cm · Eo 66cm · Hông 90cm · Dài 108cm',
    condition_grade: 'Như mới',
    condition_notes: 'Không tì vết, đã giặt hấp trước khi lên kệ.',
    fabric: 'Lụa pha viscose',
    era_tag: 'Mori nhẹ nhàng',
    price: 890000,
    original_price: 2600000,
    description:
      'Đầm hoa nhí tông đất mềm mại, tay bồng nhẹ và eo rút bèo — mang đúng tinh thần mori: nhẹ nhàng, tự nhiên như một buổi chiều dạo trong rừng thu.',
    featured: 1,
  },
  {
    name: 'Đầm ren vintage Camille',
    category: 'Đầm ren',
    brand: 'Ba&sh',
    size_label: 'M',
    measurements: 'Ngực 86cm · Eo 70cm · Hông 94cm · Dài 112cm',
    condition_grade: 'Rất tốt',
    condition_notes: 'Một vết ố rất mờ ở gấu trong, không thấy khi mặc.',
    fabric: 'Ren cotton',
    era_tag: 'Cổ điển Pháp',
    price: 1250000,
    original_price: 3400000,
    description: 'Chi tiết ren thủ công tinh xảo, cổ vuông nhẹ nhàng — item độc bản, chỉ có một chiếc duy nhất.',
    featured: 1,
  },
  {
    name: 'Đầm maxi linen Elowen',
    category: 'Đầm maxi',
    brand: 'Réalisation Par',
    size_label: 'M',
    measurements: 'Ngực 88cm · Eo 74cm · Hông 96cm · Dài 138cm',
    condition_grade: 'Như mới',
    condition_notes: 'Hoàn hảo, chưa qua sửa chữa.',
    fabric: 'Linen tự nhiên',
    era_tag: 'Mori nhẹ nhàng',
    price: 1050000,
    original_price: 2900000,
    description: 'Chất linen thoáng mát, form suông thả — dễ phối cùng cardigan hoặc giày da lộn cho set đồ mori điển hình.',
    featured: 1,
  },
  {
    name: 'Đầm dạ hội satin Noelle',
    category: 'Đầm dạ hội',
    brand: 'Reformation',
    size_label: 'S',
    measurements: 'Ngực 80cm · Eo 64cm · Hông 88cm · Dài 150cm',
    condition_grade: 'Rất tốt',
    condition_notes: 'Dây kéo lưng hoạt động tốt, một hạt đá nhỏ ở eo cần khâu lại (đã ghi chú).',
    fabric: 'Satin',
    era_tag: 'Tối giản hiện đại',
    price: 1690000,
    original_price: 4800000,
    description: 'Ánh satin đổ dáng sang trọng cho những dịp đặc biệt, phù hợp dáng người thon gọn.',
    featured: 0,
  },
  {
    name: 'Đầm công sở tweed Margaux',
    category: 'Đầm công sở',
    brand: 'Sandro',
    size_label: 'L',
    measurements: 'Ngực 92cm · Eo 78cm · Hông 98cm · Dài 96cm',
    condition_grade: 'Rất tốt',
    condition_notes: 'Sợi tweed còn nguyên form, không xù lông.',
    fabric: 'Tweed pha len',
    era_tag: 'Cổ điển Pháp',
    price: 990000,
    original_price: 3100000,
    description: 'Thiết kế thanh lịch, phù hợp môi trường công sở nhưng vẫn giữ nét nữ tính đặc trưng.',
    featured: 0,
  },
  {
    name: 'Đầm dự tiệc nhung Adeline',
    category: 'Đầm dự tiệc',
    brand: 'Rouje',
    size_label: 'M',
    measurements: 'Ngực 86cm · Eo 70cm · Hông 92cm · Dài 104cm',
    condition_grade: 'Như mới',
    condition_notes: 'Không tì vết.',
    fabric: 'Nhung mềm',
    era_tag: 'Y2K',
    price: 1150000,
    original_price: 3300000,
    description: 'Sắc rượu vang trầm ấm, chất nhung mềm rủ đẹp dáng — nổi bật trong các buổi tiệc tối.',
    featured: 1,
  },
];

async function main() {
  await ensureDatabase();

  const countRow = await queryOne('SELECT COUNT(*) AS total FROM products');

  if (countRow.total === 0) {
    const palette = ['terracotta', 'olive', 'rose', 'sand', 'clay'];
    for (let index = 0; index < sampleProducts.length; index += 1) {
      const item = sampleProducts[index];
      const slug = slugify(item.name, { lower: true, locale: 'vi', strict: true });
      const info = await run(
        `INSERT INTO products (slug, name, category, brand, size_label, measurements, condition_grade, condition_notes, fabric, era_tag, price, original_price, description, status, featured)
         VALUES (:slug, :name, :category, :brand, :size_label, :measurements, :condition_grade, :condition_notes, :fabric, :era_tag, :price, :original_price, :description, 'available', :featured)`,
        { ...item, slug }
      );
      await run('INSERT INTO product_images (product_id, placeholder_tone, sort_order) VALUES (?, ?, 0)', [
        info.insertId,
        palette[index % palette.length],
      ]);
    }
    console.log(`Đã thêm ${sampleProducts.length} sản phẩm mẫu.`);
  } else {
    console.log('Đã có sản phẩm trong cơ sở dữ liệu, bỏ qua bước seed.');
  }

  const journalCount = await queryOne('SELECT COUNT(*) AS total FROM journal_posts');
  if (journalCount.total === 0) {
    const posts = [
      {
        slug: 'phong-cach-mori-la-gi',
        title: 'Phong cách Mori là gì và vì sao mình yêu nó',
        excerpt: 'Mori kei — "cô gái rừng" — là tinh thần sống chậm, mặc đẹp và trân trọng từng món đồ cũ.',
        content:
          'Mori kei bắt nguồn từ Nhật Bản, mang cảm hứng từ thiên nhiên: vải tự nhiên, tông màu đất, form dáng thoải mái. Với teo.mhrift, mỗi chiếc váy secondhand đều kể một câu chuyện riêng...',
        cover_color: 'olive',
      },
      {
        slug: 'huong-dan-bao-quan-vay-vintage',
        title: 'Hướng dẫn bảo quản váy vintage đúng cách',
        excerpt: 'Một vài mẹo nhỏ để những chiếc váy độc bản luôn bền đẹp theo năm tháng.',
        content: 'Giặt tay với nước lạnh, phơi trong bóng râm, tránh treo quá lâu để giữ form vải...',
        cover_color: 'terracotta',
      },
      {
        slug: 'tai-sao-nen-chon-do-secondhand',
        title: 'Vì sao thời trang secondhand là lựa chọn bền vững',
        excerpt: 'Mua lại không chỉ tiết kiệm mà còn là cách yêu thương hành tinh này hơn.',
        content: 'Mỗi món đồ được tái sử dụng là một bước giảm thiểu rác thải thời trang...',
        cover_color: 'rose',
      },
    ];
    for (const p of posts) {
      await run(
        `INSERT INTO journal_posts (slug, title, excerpt, content, cover_color, published_at)
         VALUES (:slug, :title, :excerpt, :content, :cover_color, NOW())`,
        p
      );
    }
    console.log(`Đã thêm ${posts.length} bài viết nhật ký.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
