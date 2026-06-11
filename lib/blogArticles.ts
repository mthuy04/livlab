export interface BlogSection {
  heading: string;
  body: string[];
  bullets?: string[];
}

export interface BlogArticle {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  readingTime: string;
  image?: string;
  tags: string[];
  content: BlogSection[];
}

export const blogArticles: BlogArticle[] = [
  {
    slug: '5-loi-khi-mua-thiet-bi-ve-sinh-cho-phong-tam-nho',
    title: '5 lỗi thường gặp khi mua thiết bị vệ sinh cho phòng tắm nhỏ',
    category: 'Kinh nghiệm thiết kế',
    excerpt: 'Việc chọn mua thiết bị cho phòng tắm nhỏ không hề đơn giản. Đừng để diện tích hạn chế làm giảm trải nghiệm thư giãn của bạn.',
    date: '10 Th06, 2026',
    readingTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80',
    tags: ['Phòng tắm nhỏ', 'Thiết bị vệ sinh', 'Cải tạo'],
    content: [
      {
        heading: 'Chọn bồn cầu quá lớn so với không gian',
        body: [
          'Nhiều người có thói quen ưu tiên các mẫu bồn cầu liền khối đồ sộ vì trông sang trọng. Tuy nhiên, trong không gian dưới 4m², một chiếc bồn cầu quá lớn sẽ chiếm dụng diện tích di chuyển, tạo cảm giác ngột ngạt.',
          'Lời khuyên là hãy cân nhắc các mẫu bồn cầu treo tường hoặc bồn cầu 2 khối nhỏ gọn để tối ưu không gian.'
        ],
        bullets: [
          'Bồn cầu treo tường giúp dễ vệ sinh gầm.',
          'Nên chọn kích thước khoảng 650-680mm cho phòng siêu nhỏ.'
        ]
      },
      {
        heading: 'Bỏ qua khu vực lưu trữ (Storage)',
        body: [
          'Chậu rửa (lavabo) treo tường thường được chuộng vì sự gọn gàng, nhưng lại bỏ lỡ khoảng trống quý giá bên dưới. Một chiếc tủ chậu lavabo nhỏ sẽ là cứu cánh tuyệt vời giúp giấu đi các đường ống nước và cung cấp không gian cất giữ xà phòng, khăn tắm, giúp phòng tắm luôn gọn gàng.'
        ]
      },
      {
        heading: 'Lắp đặt sai kích thước gương',
        body: [
          'Gương là một công cụ giúp mở rộng không gian rất tốt. Việc chọn một chiếc gương quá nhỏ không chỉ làm giảm thẩm mỹ mà còn khiến căn phòng trông chật hẹp hơn.',
          'Gương tràn viền hoặc gương LED kích thước lớn, có sấy chống mờ là lựa chọn lý tưởng.'
        ]
      },
      {
        heading: 'Ánh sáng không đồng bộ',
        body: [
          'Phòng tắm nhỏ thường thiếu ánh sáng tự nhiên. Việc sử dụng nguồn sáng lạnh (trắng) quá chói sẽ làm căn phòng trở nên lạnh lẽo. Nên kết hợp ánh sáng ấm (3000K-4000K) từ đèn trần và đèn nền gương để tạo chiều sâu.'
        ]
      },
      {
        heading: 'Thiếu tính toán cho vách tắm kính',
        body: [
          'Sử dụng rèm nhựa sẽ khiến phòng tắm bị chia nhỏ và kém sang trọng. Lắp đặt vách kính cường lực trong suốt là giải pháp tốt nhất để phân chia khu vực khô - ướt mà vẫn giữ được sự liền mạch của không gian.'
        ]
      }
    ]
  },
  {
    slug: 'combo-phong-tam-duoi-30-trieu-gom-nhung-gi',
    title: 'Combo phòng tắm dưới 30 triệu gồm những gì?',
    category: 'Tư vấn ngân sách',
    excerpt: 'Bạn đang tìm kiếm các giải pháp thiết bị vệ sinh đầy đủ công năng với mức ngân sách tiết kiệm nhất? Khám phá ngay gói combo cơ bản.',
    date: '08 Th06, 2026',
    readingTime: '3 phút đọc',
    image: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=1200&q=80',
    tags: ['Combo', 'Ngân sách dưới 30tr', 'Tiết kiệm'],
    content: [
      {
        heading: 'Tổng quan',
        body: [
          'Với mức ngân sách dưới 30 triệu đồng, bạn hoàn toàn có thể sở hữu một bộ thiết bị phòng tắm đầy đủ công năng, mang phong cách hiện đại từ các thương hiệu uy tín nếu biết cách phân bổ hợp lý.'
        ]
      },
      {
        heading: 'Bồn cầu 1 khối hoặc 2 khối tiết kiệm nước (4 - 7 triệu)',
        body: [
          'Mức giá này cho phép bạn lựa chọn các sản phẩm từ Inax, Toto (dòng cơ bản) hoặc các thương hiệu thiết bị vệ sinh tầm trung chất lượng cao với lớp men chống bám bẩn và công nghệ xả xoáy êm ái.'
        ]
      },
      {
        heading: 'Bộ Sen tắm nóng lạnh (3 - 6 triệu)',
        body: [
          'Thay vì đầu tư sen cây nhiệt độ đắt tiền, một bộ sen tắm nóng lạnh gắn tường với bát sen tay lớn và bát sen trần mạ crome sáng bóng đã đủ đáp ứng nhu cầu thư giãn hàng ngày.'
        ]
      },
      {
        heading: 'Chậu Rửa (Lavabo) & Vòi Chậu (3 - 5 triệu)',
        body: [
          'Lavabo đặt bàn kết hợp vòi cổ cao hoặc lavabo treo tường tích hợp tủ. Tủ lavabo vật liệu nhựa PVC chống nước là sự lựa chọn tối ưu trong phân khúc giá này.'
        ]
      },
      {
        heading: 'Gương & Phụ Kiện (2 - 4 triệu)',
        body: [
          'Bao gồm gương soi (có thể chọn gương LED cảm ứng cơ bản), thanh treo khăn, móc áo, lô giấy vệ sinh và kệ kính góc. Chất liệu khuyên dùng là Inox 304 để chống rỉ sét.'
        ]
      },
      {
        heading: 'Gạch ốp lát (5 - 8 triệu)',
        body: [
          'Diện tích phòng tắm chuẩn khoảng 4m² sẽ cần khoảng 20-25m² gạch. Ưu tiên các loại gạch porcelain mờ chống trơn trượt cho sàn và gạch ceramic vân đá mộc mạc cho tường.',
          'Lưu ý: Để chắc chắn các sản phẩm đồng bộ về kích thước và màu sắc, bạn có thể tham khảo gói gợi ý trên LivLab. Chúng tôi đã tính toán kỹ lưỡng tỉ lệ cũng như màu sắc để đảm bảo không gian của bạn đạt thẩm mỹ cao nhất.'
        ]
      }
    ]
  },
  {
    slug: 'cach-phoi-lavabo-voi-guong-va-voi-rua',
    title: 'Cách phối lavabo, gương và vòi rửa sao cho đồng bộ',
    category: 'Mẹo thiết kế',
    excerpt: 'Bộ 3 lavabo, vòi rửa và gương là trung tâm thu hút sự chú ý của mọi phòng tắm. Sự kết hợp tinh tế giữa chúng quyết định 80% thẩm mỹ.',
    date: '05 Th06, 2026',
    readingTime: '5 phút đọc',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80',
    tags: ['Lavabo', 'Gương', 'Thiết kế đồng bộ'],
    content: [
      {
        heading: 'Tuân thủ tỷ lệ kích thước',
        body: [
          'Gương không bao giờ được rộng hơn bàn đá lavabo. Tỷ lệ vàng là chiều rộng gương bằng khoảng 70-80% chiều rộng của tủ/bàn lavabo.',
          'Vòi rửa cũng cần có độ cao và độ vươn phù hợp: vòi cổ thấp cho chậu âm bàn/bán âm, và vòi cổ cao cho chậu đặt bàn.'
        ]
      },
      {
        heading: 'Đồng bộ về mặt đường nét (Hình học)',
        body: [
          'Nếu bạn chọn chậu lavabo hình chữ nhật vuông vức, hãy đi kèm với một chiếc gương chữ nhật viền kim loại và vòi rửa có đường nét dứt khoát, góc cạnh. Ngược lại, chậu tròn hoặc oval sẽ kết hợp hoàn hảo với gương tròn/gương vòm và vòi rửa có đường cong mềm mại.'
        ]
      },
      {
        heading: 'Thống nhất vật liệu và màu sắc (Finishes)',
        body: [
          'Đây là quy tắc quan trọng nhất. Hãy cố gắng đồng bộ màu sắc kim loại: nếu vòi rửa màu đen nhám (Matte Black), viền gương cũng nên là viền đen nhám hoặc không viền. Nếu vòi mạ bóng (Chrome), viền gương inox bạc sẽ tạo sự kết nối liền mạch.'
        ]
      },
      {
        heading: 'Phối màu tương phản (Contrast)',
        body: [
          'Để khu vực lavabo trở thành điểm nhấn, hãy tận dụng sự tương phản. Chậu lavabo trắng sứ trên mặt bàn đá đen vân mây, kết hợp với bộ vòi và gương mạ vàng xước (Brushed Gold) sẽ lập tức mang đến cảm giác sang trọng chuẩn khách sạn 5 sao.'
        ]
      }
    ]
  },
  {
    slug: 'vi-sao-nen-xem-concept-truoc-khi-xin-bao-gia',
    title: 'Vì sao nên xem concept trước khi xin báo giá?',
    category: 'Góc tư vấn',
    excerpt: 'Đừng đi xin báo giá khi bạn chưa biết mình thực sự muốn không gian trông như thế nào. Concept đóng vai trò làm kim chỉ nam mua sắm.',
    date: '02 Th06, 2026',
    readingTime: '3 phút đọc',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
    tags: ['Concept', 'Báo giá', 'Lưu ý'],
    content: [
      {
        heading: 'Hình dung tổng thể không gian',
        body: [
          'Nhiều khách hàng bắt đầu quá trình cải tạo phòng tắm bằng việc xin catalogue sản phẩm từ nhiều thương hiệu khác nhau. Việc này thường dẫn đến sự bối rối, quá tải thông tin và quyết định mua sắm thiếu đồng bộ.',
          'Khi nhìn vào một chiếc bồn cầu hay lavabo đơn lẻ trên phông nền trắng, rất khó để bạn tưởng tượng nó sẽ trông như thế nào khi kết hợp với gạch ốp màu xám tro. Concept hình ảnh 3D giúp bạn nhìn thấy bức tranh tổng thể, từ ánh sáng, màu gạch đến sự sắp đặt của từng thiết bị.'
        ]
      },
      {
        heading: 'Kiểm soát ngân sách hiệu quả hơn',
        body: [
          'Một concept đã được lên sẵn thường đi kèm với ước tính ngân sách cho toàn bộ gói. Bạn sẽ không bị rơi vào tình trạng vung tay quá trán cho một chiếc vòi đắt tiền nhưng lại phải cắt xén chi phí cho bộ gạch ốp, làm hỏng toàn bộ thẩm mỹ của phòng.'
        ]
      },
      {
        heading: 'Rút ngắn thời gian làm việc với showroom',
        body: [
          'Thay vì phải mô tả "Tôi muốn một phòng tắm tối giản, hiện đại", bạn chỉ cần gửi cho showroom một concept cụ thể: "Tôi muốn làm theo mẫu Japandi này". Showroom sẽ lập tức hiểu gu thẩm mỹ của bạn, biết chính xác bạn cần dòng sản phẩm nào và cung cấp báo giá sát nhất chỉ trong thời gian ngắn.'
        ]
      }
    ]
  },
  {
    slug: 'checklist-cai-tao-phong-tam-can-ho-cho-thue',
    title: 'Checklist cải tạo phòng tắm cho căn hộ cho thuê',
    category: 'Kinh nghiệm đầu tư',
    excerpt: 'Đầu tư cải tạo phòng tắm để tăng giá trị cho thuê là một bài toán đòi hỏi sự cân bằng giữa chi phí, độ bền và tính thẩm mỹ.',
    date: '28 Th05, 2026',
    readingTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    tags: ['Nhà cho thuê', 'Cải tạo', 'Checklist'],
    content: [
      {
        heading: 'Đặt tiêu chí Dễ Vệ Sinh lên hàng đầu',
        body: [
          'Phòng tắm là một trong hai không gian (cùng với nhà bếp) quyết định phần lớn ấn tượng của khách thuê đối với căn hộ.',
          'Sử dụng gạch kích thước lớn (60x60cm hoặc 60x120cm) để hạn chế đường ron, nơi dễ bám bẩn và nấm mốc nhất. Tránh sử dụng gạch mosaic hạt nhỏ cho sàn phòng tắm ướt. Nên ưu tiên bồn cầu có thiết kế trơn láng, không có nhiều khe rãnh để giảm thiểu thời gian lau chùi.'
        ]
      },
      {
        heading: 'Đầu tư vào Vòi rửa và Sen tắm chất lượng',
        body: [
          'Đây là hai thiết bị được sử dụng với tần suất cao nhất và dễ hư hỏng nhất (rò rỉ nước, gãy cần gạt). Đừng tiếc tiền mua các sản phẩm từ những thương hiệu có uy tín, có chế độ bảo hành rõ ràng, lõi van đĩa sứ (ceramic cartridge) độ bền cao.'
        ]
      },
      {
        heading: 'Không gian lưu trữ thông minh',
        body: [
          'Khách thuê rất trân trọng những căn hộ có đủ chỗ để đồ cá nhân. Một chiếc kệ góc trong phòng tắm kính và một chiếc tủ gương (mirror cabinet) hoặc tủ lavabo nhỏ sẽ là điểm cộng rất lớn.'
        ]
      },
      {
        heading: 'Ánh sáng và Thông gió',
        body: [
          'Luôn đảm bảo phòng tắm có quạt hút gió hoạt động tốt để tránh ẩm mốc hư hại trần thạch cao. Ánh sáng cần đủ sáng tại khu vực gương (đèn downlight trắng/vàng nhạt) để phục vụ việc trang điểm, cạo râu.'
        ]
      },
      {
        heading: 'Nâng cấp nhỏ, hiệu ứng lớn',
        body: [
          'Bạn không cần phải đập toàn bộ phòng tắm đi làm lại. Đôi khi chỉ cần thay thế nắp bồn cầu mới, làm sạch mạch gạch (chà ron men sứ), thay bộ vòi sen và lắp một chiếc gương LED mới là căn phòng đã hoàn toàn lột xác.'
        ]
      }
    ]
  }
];

export function getBlogArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find(a => a.slug === slug);
}

export function getRelatedBlogArticles(slug: string): BlogArticle[] {
  return blogArticles.filter(a => a.slug !== slug).slice(0, 3);
}
