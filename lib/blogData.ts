export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  image: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'post_1',
    slug: '5-loi-khi-mua-thiet-bi-ve-sinh-cho-phong-tam-nho',
    title: '5 lỗi thường gặp khi mua thiết bị vệ sinh cho phòng tắm nhỏ',
    category: 'Kinh nghiệm thiết kế',
    date: '10 Th06, 2026',
    readTime: '4 phút đọc',
    excerpt: 'Việc chọn mua thiết bị cho phòng tắm nhỏ không hề đơn giản. Đừng để diện tích hạn chế làm giảm trải nghiệm thư giãn của bạn.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
    content: `
      <h2>1. Chọn bồn cầu quá lớn so với không gian</h2>
      <p>Nhiều người có thói quen ưu tiên các mẫu bồn cầu liền khối đồ sộ vì trông sang trọng. Tuy nhiên, trong không gian dưới 4m², một chiếc bồn cầu quá lớn sẽ chiếm dụng diện tích di chuyển, tạo cảm giác ngột ngạt. Lời khuyên là hãy cân nhắc các mẫu bồn cầu treo tường hoặc bồn cầu 2 khối nhỏ gọn để tối ưu không gian.</p>
      
      <h2>2. Bỏ qua khu vực lưu trữ (Storage)</h2>
      <p>Chậu rửa (lavabo) treo tường thường được chuộng vì sự gọn gàng, nhưng lại bỏ lỡ khoảng trống quý giá bên dưới. Một chiếc tủ chậu lavabo nhỏ sẽ là cứu cánh tuyệt vời giúp giấu đi các đường ống nước và cung cấp không gian cất giữ xà phòng, khăn tắm, giúp phòng tắm luôn gọn gàng.</p>
      
      <h2>3. Lắp đặt sai kích thước gương</h2>
      <p>Gương là một công cụ giúp mở rộng không gian rất tốt. Việc chọn một chiếc gương quá nhỏ không chỉ làm giảm thẩm mỹ mà còn khiến căn phòng trông chật hẹp hơn. Gương tràn viền hoặc gương LED kích thước lớn, có sấy chống mờ là lựa chọn lý tưởng.</p>
      
      <h2>4. Ánh sáng không đồng bộ</h2>
      <p>Phòng tắm nhỏ thường thiếu ánh sáng tự nhiên. Việc sử dụng nguồn sáng lạnh (trắng) quá chói sẽ làm căn phòng trở nên lạnh lẽo. Nên kết hợp ánh sáng ấm (3000K-4000K) từ đèn trần và đèn nền gương để tạo chiều sâu.</p>
      
      <h2>5. Thiếu tính toán cho vách tắm kính</h2>
      <p>Sử dụng rèm nhựa sẽ khiến phòng tắm bị chia nhỏ và kém sang trọng. Lắp đặt vách kính cường lực trong suốt là giải pháp tốt nhất để phân chia khu vực khô - ướt mà vẫn giữ được sự liền mạch của không gian.</p>
    `
  },
  {
    id: 'post_2',
    slug: 'combo-phong-tam-duoi-30-trieu-gom-nhung-gi',
    title: 'Combo phòng tắm dưới 30 triệu gồm những gì?',
    category: 'Tư vấn ngân sách',
    date: '08 Th06, 2026',
    readTime: '3 phút đọc',
    excerpt: 'Bạn đang tìm kiếm các giải pháp thiết bị vệ sinh đầy đủ công năng với mức ngân sách tiết kiệm nhất? Khám phá ngay gói combo cơ bản.',
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80',
    content: `
      <p>Với mức ngân sách dưới 30 triệu đồng, bạn hoàn toàn có thể sở hữu một bộ thiết bị phòng tắm đầy đủ công năng, mang phong cách hiện đại từ các thương hiệu uy tín nếu biết cách phân bổ hợp lý.</p>
      
      <h2>1. Bồn cầu 1 khối hoặc 2 khối tiết kiệm nước (4 - 7 triệu)</h2>
      <p>Mức giá này cho phép bạn lựa chọn các sản phẩm từ Inax, Toto (dòng cơ bản) hoặc các thương hiệu thiết bị vệ sinh tầm trung chất lượng cao với lớp men chống bám bẩn và công nghệ xả xoáy êm ái.</p>
      
      <h2>2. Bộ Sen tắm nóng lạnh (3 - 6 triệu)</h2>
      <p>Thay vì đầu tư sen cây nhiệt độ đắt tiền, một bộ sen tắm nóng lạnh gắn tường với bát sen tay lớn và bát sen trần mạ crome sáng bóng đã đủ đáp ứng nhu cầu thư giãn hàng ngày.</p>
      
      <h2>3. Chậu Rửa (Lavabo) & Vòi Chậu (3 - 5 triệu)</h2>
      <p>Lavabo đặt bàn kết hợp vòi cổ cao hoặc lavabo treo tường tích hợp tủ. Tủ lavabo vật liệu nhựa PVC chống nước là sự lựa chọn tối ưu trong phân khúc giá này.</p>
      
      <h2>4. Gương & Phụ Kiện (2 - 4 triệu)</h2>
      <p>Bao gồm gương soi (có thể chọn gương LED cảm ứng cơ bản), thanh treo khăn, móc áo, lô giấy vệ sinh và kệ kính góc. Chất liệu khuyên dùng là Inox 304 để chống rỉ sét.</p>
      
      <h2>5. Gạch ốp lát (5 - 8 triệu)</h2>
      <p>Diện tích phòng tắm chuẩn khoảng 4m² sẽ cần khoảng 20-25m² gạch. Ưu tiên các loại gạch porcelain mờ chống trơn trượt cho sàn và gạch ceramic vân đá mộc mạc cho tường.</p>
      
      <p><strong>Lưu ý:</strong> Để chắc chắn các sản phẩm đồng bộ về kích thước và màu sắc, bạn có thể tham khảo gói "Combo Essential Compact" trên LivLab. Chúng tôi đã tính toán kỹ lưỡng tỉ lệ cũng như màu sắc để đảm bảo không gian của bạn đạt thẩm mỹ cao nhất.</p>
    `
  },
  {
    id: 'post_3',
    slug: 'cach-phoi-lavabo-voi-guong-va-voi-rua',
    title: 'Cách phối lavabo, gương và vòi rửa sao cho đồng bộ',
    category: 'Mẹo thiết kế',
    date: '05 Th06, 2026',
    readTime: '5 phút đọc',
    excerpt: 'Bộ 3 lavabo, vòi rửa và gương là trung tâm thu hút sự chú ý của mọi phòng tắm. Sự kết hợp tinh tế giữa chúng quyết định 80% thẩm mỹ.',
    image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&q=80',
    content: `
      <h2>1. Tuân thủ tỷ lệ kích thước</h2>
      <p>Gương không bao giờ được rộng hơn bàn đá lavabo. Tỷ lệ vàng là chiều rộng gương bằng khoảng 70-80% chiều rộng của tủ/bàn lavabo. Vòi rửa cũng cần có độ cao và độ vươn phù hợp: vòi cổ thấp cho chậu âm bàn/bán âm, và vòi cổ cao cho chậu đặt bàn.</p>
      
      <h2>2. Đồng bộ về mặt đường nét (Hình học)</h2>
      <p>Nếu bạn chọn chậu lavabo hình chữ nhật vuông vức, hãy đi kèm với một chiếc gương chữ nhật viền kim loại và vòi rửa có đường nét dứt khoát, góc cạnh. Ngược lại, chậu tròn hoặc oval sẽ kết hợp hoàn hảo với gương tròn/gương vòm và vòi rửa có đường cong mềm mại.</p>
      
      <h2>3. Thống nhất vật liệu và màu sắc (Finishes)</h2>
      <p>Đây là quy tắc quan trọng nhất. Hãy cố gắng đồng bộ màu sắc kim loại: nếu vòi rửa màu đen nhám (Matte Black), viền gương cũng nên là viền đen nhám hoặc không viền. Nếu vòi mạ bóng (Chrome), viền gương inox bạc sẽ tạo sự kết nối liền mạch.</p>
      
      <h2>4. Phối màu tương phản (Contrast)</h2>
      <p>Để khu vực lavabo trở thành điểm nhấn, hãy tận dụng sự tương phản. Chậu lavabo trắng sứ trên mặt bàn đá đen vân mây, kết hợp với bộ vòi và gương mạ vàng xước (Brushed Gold) sẽ lập tức mang đến cảm giác sang trọng (Luxury) chuẩn khách sạn 5 sao.</p>
    `
  },
  {
    id: 'post_4',
    slug: 'vi-sao-nen-xem-concept-truoc-khi-xin-bao-gia',
    title: 'Vì sao nên xem concept trước khi xin báo giá?',
    category: 'Góc tư vấn',
    date: '02 Th06, 2026',
    readTime: '3 phút đọc',
    excerpt: 'Đừng đi xin báo giá khi bạn chưa biết mình thực sự muốn không gian trông như thế nào. Concept đóng vai trò làm kim chỉ nam mua sắm.',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80',
    content: `
      <p>Nhiều khách hàng bắt đầu quá trình cải tạo phòng tắm bằng việc xin catalogue sản phẩm từ nhiều thương hiệu khác nhau. Việc này thường dẫn đến sự bối rối, quá tải thông tin và quyết định mua sắm thiếu đồng bộ.</p>
      
      <h2>Hình dung tổng thể không gian</h2>
      <p>Khi nhìn vào một chiếc bồn cầu hay lavabo đơn lẻ trên phông nền trắng, rất khó để bạn tưởng tượng nó sẽ trông như thế nào khi kết hợp với gạch ốp màu xám tro. Concept hình ảnh 3D giúp bạn nhìn thấy bức tranh tổng thể, từ ánh sáng, màu gạch đến sự sắp đặt của từng thiết bị.</p>
      
      <h2>Kiểm soát ngân sách hiệu quả hơn</h2>
      <p>Một concept đã được lên sẵn (như trên nền tảng LivLab) thường đi kèm với ước tính ngân sách cho toàn bộ gói. Bạn sẽ không bị rơi vào tình trạng vung tay quá trán cho một chiếc vòi đắt tiền nhưng lại phải cắt xén chi phí cho bộ gạch ốp, làm hỏng toàn bộ thẩm mỹ của phòng.</p>
      
      <h2>Rút ngắn thời gian làm việc với showroom</h2>
      <p>Thay vì phải mô tả "Tôi muốn một phòng tắm tối giản, hiện đại", bạn chỉ cần gửi cho showroom một concept cụ thể: "Tôi muốn làm theo mẫu Japandi này". Showroom sẽ lập tức hiểu gu thẩm mỹ của bạn, biết chính xác bạn cần dòng sản phẩm nào và cung cấp báo giá sát nhất chỉ trong vòng 24h.</p>
    `
  },
  {
    id: 'post_5',
    slug: 'checklist-cai-tao-phong-tam-can-ho-cho-thue',
    title: 'Checklist cải tạo phòng tắm cho căn hộ cho thuê',
    category: 'Kinh nghiệm đầu tư',
    date: '28 Th05, 2026',
    readTime: '4 phút đọc',
    excerpt: 'Đầu tư cải tạo phòng tắm để tăng giá trị cho thuê là một bài toán đòi hỏi sự cân bằng giữa chi phí, độ bền và tính thẩm mỹ.',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    content: `
      <p>Phòng tắm là một trong hai không gian (cùng với nhà bếp) quyết định phần lớn ấn tượng của khách thuê đối với căn hộ. Dưới đây là những ưu tiên hàng đầu khi cải tạo phòng tắm với mục đích kinh doanh cho thuê.</p>
      
      <h2>1. Đặt tiêu chí Dễ Vệ Sinh lên hàng đầu</h2>
      <p>Sử dụng gạch kích thước lớn (60x60cm hoặc 60x120cm) để hạn chế đường ron, nơi dễ bám bẩn và nấm mốc nhất. Tránh sử dụng gạch mosaic hạt nhỏ cho sàn phòng tắm ướt. Nên ưu tiên bồn cầu có thiết kế trơn láng, không có nhiều khe rãnh để giảm thiểu thời gian lau chùi.</p>
      
      <h2>2. Đầu tư vào Vòi rửa và Sen tắm chất lượng</h2>
      <p>Đây là hai thiết bị được sử dụng với tần suất cao nhất và dễ hư hỏng nhất (rò rỉ nước, gãy cần gạt). Đừng tiếc tiền mua các sản phẩm từ những thương hiệu có uy tín, có chế độ bảo hành rõ ràng, lõi van đĩa sứ (ceramic cartridge) độ bền cao.</p>
      
      <h2>3. Không gian lưu trữ thông minh</h2>
      <p>Khách thuê rất trân trọng những căn hộ có đủ chỗ để đồ cá nhân. Một chiếc kệ góc trong phòng tắm kính và một chiếc tủ gương (mirror cabinet) hoặc tủ lavabo nhỏ sẽ là điểm cộng rất lớn.</p>
      
      <h2>4. Ánh sáng và Thông gió</h2>
      <p>Luôn đảm bảo phòng tắm có quạt hút gió hoạt động tốt để tránh ẩm mốc hư hại trần thạch cao. Ánh sáng cần đủ sáng tại khu vực gương (đèn downlight trắng/vàng nhạt) để phục vụ việc trang điểm, cạo râu.</p>
      
      <h2>5. Nâng cấp nhỏ, hiệu ứng lớn</h2>
      <p>Bạn không cần phải đập toàn bộ phòng tắm đi làm lại. Đôi khi chỉ cần thay thế nắp bồn cầu mới, làm sạch mạch gạch (chà ron men sứ), thay bộ vòi sen và lắp một chiếc gương LED mới là căn phòng đã hoàn toàn lột xác.</p>
    `
  }
];
