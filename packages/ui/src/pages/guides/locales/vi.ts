import type { GuideId, Guide, GuideCopy } from '../content';

const secretHitlerRules = {
  label: 'Luật chính thức của Secret Hitler',
  url: 'https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf',
};
const secretHitlerOnline = { label: 'Secret Hitler.io', url: 'https://secrethitler.io/' };
const werewolfRules = {
  label: 'Ma Sói Ultimate Werewolf của Bézier Games',
  url: 'https://beziergames.com/products/ultimate-werewolf',
};
const oneNight = {
  label: 'Ma Sói một đêm One Night Ultimate Werewolf của Bézier Games',
  url: 'https://beziergames.com/products/one-night-ultimate-werewolf',
};
const browserWerewolf = { label: 'Ma Sói trên BoardGameJoin', url: 'https://boardgamejoin.com/en/games/werewolf/' };
const amongUs = { label: 'Among Us của Innersloth', url: 'https://www.innersloth.com/games/among-us/' };

export const guides: Record<GuideId, Guide> = {
  social_deduction_games_online: {
    slug: 'social-deduction-games-online',
    breadcrumb: 'Trò chơi suy luận xã hội',
    title: 'Trò chơi suy luận xã hội: bốn lựa chọn cho nhóm bạn',
    lead: 'Chọn Avalon nếu thích bỏ phiếu Nhiệm vụ mà không bị loại sớm, Secret Hitler nếu thích thẻ chính sách, hoặc Ma Sói nếu thích vai trò hành động ban đêm. Các trò suy luận xã hội này có phiên bản trình duyệt cho 5–10 người bạn; Among Us có thêm di chuyển và cần cài đặt trò chơi.',
    preview: true,
    table: {
      caption: 'Chọn trò chơi cho buổi gặp mặt tiếp theo của nhóm',
      columns: ['Trò chơi và số người', 'Nên chọn khi thích', 'Khác biệt thực tế'],
      rows: [
        {
          title: 'Avalon · 5–10 người thật, hoặc chơi một mình / cùng bạn bè và bot',
          cells: [
            'Thảo luận, bỏ phiếu công khai và bí mật phá hoại Nhiệm vụ.',
            'Ván thông thường miễn phí cho 5–10 người có tài khoản. Chơi một mình hoặc mời bạn bè và để bot lấp chỗ trống; chọn số chỗ và chế độ hiện có trong phần thiết lập. Không ai bị loại trong các Nhiệm vụ.',
          ],
        },
        {
          title: 'Secret Hitler · 5–10 người',
          cells: [
            'Bầu chính phủ và tranh luận về những gì đã xảy ra với thẻ chính sách.',
            'Có thể chơi trên trình duyệt tại Secret Hitler.io, với tài khoản và tùy chọn ván riêng tư. Việc hành quyết có thể loại người chơi.',
          ],
          source: secretHitlerOnline,
        },
        {
          title: 'Ma Sói · 4–30 người trên BoardGameJoin',
          cells: [
            'Chu kỳ ngày đêm quen thuộc với những lời buộc tội và vai trò đặc biệt.',
            'Phiên bản trình duyệt này hỗ trợ cả nhóm 5–10 người. Trò chơi xử lý hành động ban đêm và phiếu bầu, còn chủ phòng chuyển giai đoạn; người chơi có thể bị loại.',
          ],
          source: browserWerewolf,
        },
        {
          title: 'Among Us · 4–15 người',
          cells: [
            'Di chuyển, hoàn thành công việc và xây dựng bằng chứng ngoại phạm.',
            'Cần cài đặt trò chơi thay vì chơi trên trình duyệt. Kiểm tra nền tảng và cài đặt trò chuyện của mọi người trước buổi chơi.',
          ],
          source: amongUs,
        },
      ],
    },
    sections: [
      {
        title: 'Trò suy luận xã hội nào phù hợp nhất với nhóm của bạn?',
        paragraphs: [
          'Chọn Avalon nếu nhóm thích xem xét lại những quyết định tin tưởng qua từng lượt. Mọi người bỏ phiếu cho Đội được đề cử, nhưng chỉ Đội đó bí mật nộp thẻ Nhiệm vụ. Một Nhiệm vụ Thất bại thu hẹp nghi ngờ vào các thành viên; một Nhiệm vụ Thành công vẫn có thể chứa người phe Ác đã chọn không phá hoại.',
          'Chọn Secret Hitler nếu nhóm thích những lời kể mâu thuẫn về một lượt trao đổi thẻ riêng tư. Tổng thống và Thủ tướng chọn một chính sách từ các thẻ được rút, nên cả kết quả lẫn lời giải thích của họ đều quan trọng. Bộ thẻ chính sách tạo ra sự bất định mà thẻ Nhiệm vụ của Avalon cơ bản không có.',
        ],
        source: secretHitlerRules,
      },
      {
        title: 'Chọn Ma Sói cho hành động ban đêm, Among Us cho việc di chuyển',
        paragraphs: [
          'Ma Sói cổ điển và Mafia xoay quanh việc loại người bị nghi ngờ và suy luận từ hành động ban đêm. Với nhóm chơi từ xa, hãy dùng phiên bản quản lý được bộ luật đã chọn, hoặc thống nhất ai làm quản trò. BoardGameJoin nêu trên tự động xử lý hành động bí mật, nhưng chủ phòng vẫn phải chuyển các giai đoạn của ván chơi.',
          'Among Us bổ sung hành động giữa các cuộc thảo luận: Phi hành đoàn hoàn thành công việc trong khi Kẻ mạo danh phá hoại và sát hại. Các cuộc họp biến những gì mọi người nhìn thấy thành lời buộc tội. Trò này hợp với nhóm muốn có việc để làm giữa các cuộc tranh luận, còn Avalon giữ mọi người tập trung vào quyết định Nhiệm vụ chung.',
        ],
        source: amongUs,
      },
      {
        title: 'Trò chơi nào tránh loại người chơi từ sớm?',
        paragraphs: [
          'Avalon giữ mọi người tham gia thảo luận và mọi lần bỏ phiếu chọn Đội trong suốt các Nhiệm vụ. Không được chọn vào một Nhiệm vụ chỉ là tạm thời: bạn vẫn bỏ phiếu, theo dõi kết quả và có thể được chọn lần sau. Ám sát là quyết định cuối ván, không phải chuỗi loại người khiến họ phải ngồi ngoài hết buổi.',
          'Không phải mọi trò Ma Sói đều có cơ chế loại người trong ván. One Night Ultimate Werewolf, hay Ma Sói một đêm, là trò riêng cho 3–10 người với một đêm, một cuộc thảo luận và không ai bị loại sớm. Ứng dụng trình duyệt của nhà phát hành hỗ trợ lời dẫn; bản thân nó không phải một phòng chơi nhiều người từ xa hoàn chỉnh.',
        ],
        source: oneNight,
      },
      {
        title: 'Cách tổ chức ván chơi trực tuyến với bạn bè',
        paragraphs: [
          'Đếm những người thực sự tham gia, chọn ngôn ngữ chung và thống nhất cách trò chuyện trước khi gửi liên kết ván chơi. Để chơi Avalon tại đây, mỗi người cần tài khoản và thiết bị riêng. Bắt đầu với các vai quen thuộc, rồi để vai tùy chọn và bản mở rộng cho ván sau.',
          'Nếu chưa đủ năm người sẵn sàng, bạn có thể chơi một mình hoặc mời bạn bè và để bot lấp chỗ trống. Với ván thông thường giữa người thật, hãy hẹn lúc khác hoặc tìm thêm người. Bảng người chơi và bảng nhóm giúp mọi người liên hệ với nhau; chúng không tự động lấp đầy phòng hay hứa hẹn ghép trận ngay lập tức.',
        ],
      },
      {
        title: 'Có thể tự học cách chơi Avalon với bot không?',
        paragraphs: [
          'Bạn không cần tập hợp đủ nhóm để thử vòng Nhiệm vụ. Chơi một mình với bot cho phép bạn đề cử Đội, bỏ phiếu và xem kết quả Nhiệm vụ; chế độ có hướng dẫn Ván đầu tiên giúp bạn học chơi. Hoặc mời bạn bè và để bot lấp chỗ trống, rồi chọn số chỗ và chế độ trong phần thiết lập.',
          'Dùng ván với bot để hiểu thông tin của Merlin và lượt Ám sát cuối gắn với các Nhiệm vụ thế nào, rồi hướng dẫn nhóm bạn thật đưa ra những quyết định đó. Phần thiết lập AI trong sảnh hiển thị các chế độ và số chỗ đang có.',
        ],
      },
      {
        title: 'Chơi trên trình duyệt không cần tải xuống: cần chuẩn bị gì?',
        paragraphs: [
          'Để chơi Avalon online tại đây, mỗi người mở phòng bằng trình duyệt trên điện thoại, máy tính bảng hoặc máy tính riêng; không cần cài ứng dụng. Ván thông thường giữa người thật miễn phí cho 5–10 người có tài khoản. Chia sẻ liên kết phòng và giữ thông tin vai trò riêng tư trên các màn hình khác nhau. Trong phần so sánh này, Among Us vẫn là lựa chọn cần cài đặt.',
          'Nếu bạn bè chưa sẵn sàng hết, bạn có thể thử Avalon một mình hoặc mời bạn bè và để bot lấp chỗ trống. Chơi với bot cũng cần tài khoản. Kiểm tra phần thiết lập để biết chế độ, ngôn ngữ thảo luận và số chỗ hiện có, kể cả số chỗ yêu cầu Premium; ván thông thường miễn phí giữa người thật không đồng nghĩa mọi tùy chọn AI đều miễn phí hoặc luôn có sẵn.',
        ],
      },
    ],
  },
  games_like_secret_hitler: {
    slug: 'games-like-secret-hitler',
    breadcrumb: 'Trò chơi giống Secret Hitler',
    title: 'Trò chơi giống Secret Hitler: thử Avalon',
    lead: 'Bạn đang tìm trò chơi giống Secret Hitler? Avalon giữ cơ chế phe ẩn và bỏ phiếu đa số cho 5–10 người bạn, thay việc rút chính sách bằng thẻ Nhiệm vụ. Mọi người đều tham gia suốt các Nhiệm vụ và có thể chơi trên trình duyệt.',
    table: {
      caption: 'Secret Hitler và Avalon: những quyết định thay đổi',
      columns: ['Quyết định', 'Secret Hitler', 'Avalon'],
      rows: [
        {
          title: 'Bạn bỏ phiếu thông qua điều gì?',
          cells: [
            'Một Tổng thống và Thủ tướng được đề cử.',
            'Một Đội có số người tùy theo Nhiệm vụ và tổng số người chơi.',
          ],
        },
        {
          title: 'Hành động bí mật',
          cells: [
            'Cặp đôi được bầu rút và loại bỏ thẻ chính sách.',
            'Mỗi người được chọn bí mật nộp một thẻ Nhiệm vụ.',
          ],
        },
        {
          title: 'Điều gì có thể giải thích một kết quả xấu?',
          cells: [
            'Lựa chọn chính sách và các thẻ có trong lượt rút.',
            'Trong trò cơ bản, ít nhất một thành viên phe Ác trong Đội đã chọn Thất bại.',
          ],
        },
        {
          title: 'Sự tham gia',
          cells: [
            'Việc hành quyết có thể loại người chơi trước khi ván kết thúc.',
            'Mọi người tiếp tục thảo luận và bỏ phiếu suốt các Nhiệm vụ.',
          ],
        },
        {
          title: 'Điều kiện kết thúc đặc biệt',
          cells: [
            'Bầu Hitler làm Thủ tướng sau ba chính sách Phát xít có thể kết thúc ván chơi.',
            'Sau ba Nhiệm vụ Thành công, phe Ác vẫn có thể thắng bằng cách xác định Merlin.',
          ],
        },
      ],
    },
    sections: [
      {
        title: 'Bỏ phiếu và thẻ bí mật khác nhau thế nào?',
        paragraphs: [
          'Cả hai trò đều cần đa số thông qua đề xuất, và số phiếu hòa sẽ khiến đề xuất bị bác bỏ. Việc chú ý ai đã ủng hộ ai vẫn hữu ích. Trong Avalon, hãy hỏi vì sao ai đó ủng hộ cả Đội thay vì chỉ xem Đội trưởng là người duy nhất cần được đánh giá.',
          'Lượt rút chính sách của Secret Hitler có thể khiến ngay cả người giữ chức vụ trung thành cũng không có chính sách Tự do để ban hành. Avalon cơ bản không có bộ thẻ chính sách chung: thành viên phe Thiện trong Nhiệm vụ phải chọn Thành công, còn phe Ác có thể chọn Thành công hoặc Thất bại. Vì thế, thẻ Thất bại cho bạn thông tin về Đội, dù không xác định người đã nộp thẻ đó.',
        ],
        source: secretHitlerRules,
      },
      {
        title: 'Nhiệm vụ Thành công có chứng minh người chơi thuộc phe Thiện không?',
        paragraphs: [
          'Giả sử Alice và Ben tham gia Nhiệm vụ đầu trong ván năm người. Ba phiếu Tán thành là đủ để cử họ đi. Nếu Nhiệm vụ Thất bại, ít nhất một trong hai thuộc phe Ác ở thiết lập cơ bản. Nếu Thành công, một trong hai vẫn có thể là Ác và đã chọn Thành công để lấy lòng tin.',
          'So sánh những phiếu bầu và Đội họ đề cử về sau với kết quả đó. Dùng lại một Đội từng Thành công là quyết định cần thảo luận, không phải quy tắc xác nhận họ đều Thiện. Ở Nhiệm vụ thứ tư với từ bảy người trở lên, cần hai thẻ Thất bại; một thẻ Thất bại vẫn có thể xuất hiện trong kết quả Thành công.',
        ],
      },
      {
        title: 'Merlin và Hitler: vì sao lộ vai trò mang ý nghĩa khác nhau?',
        paragraphs: [
          'Secret Hitler đặt danh tính của một người phe Ác cụ thể vào trung tâm điều kiện thắng qua bầu cử. Avalon cho một người phe Thiện là Merlin biết thông tin về phe Ác ngay khi thiết lập. Merlin phải dẫn dắt phe Thiện mà không để lộ rõ kiến thức đó, vì sau ba Nhiệm vụ Thành công, phe Ác vẫn có cơ hội Ám sát.',
          'Tránh mang thói quen “phe Thiện nên tiết lộ mọi thứ” vào mọi tình huống. Một lời giải thích tự tin có thể giúp Nhiệm vụ Thành công, đồng thời giúp phe Ác nhận diện Merlin. Hướng dẫn vai trò giải thích Merlin thấy ai và vai tùy chọn nào làm thay đổi thông tin đó.',
        ],
      },
      {
        title: 'Khi nào Avalon là lựa chọn thay thế Secret Hitler phù hợp?',
        paragraphs: [
          'Thử Avalon nếu nhóm muốn có Đội với nhiều số người khác nhau, bằng chứng từ Nhiệm vụ và sự tham gia liên tục. Tiếp tục chơi Secret Hitler nếu bạn bè thích nhất sự bất định của chính sách và quyền hành pháp. Cả hai đều có phiên bản trình duyệt; riêng khả năng chơi trên trình duyệt không phải lý do để đổi trò.',
          'Với ván Avalon thông thường giữa người thật tại đây, tập hợp 5–10 người, yêu cầu mọi người đăng nhập và chọn các vai tùy chọn, bản mở rộng đơn giản. Bạn cũng có thể học với bot trước. Đọc các khác biệt của nền tảng bên dưới trước khi cho rằng luật đề xuất bị bác bỏ hoặc Ám sát hoạt động y như bản cờ bàn.',
        ],
        source: { label: 'Luật và phiên bản trình duyệt của Secret Hitler.io', url: 'https://secrethitler.io/rules' },
      },
      {
        title: 'Học bỏ phiếu Nhiệm vụ với bot trước khi đổi trò',
        paragraphs: [
          'Nếu nhóm Secret Hitler chưa trực tuyến, hãy thử Avalon một mình với bot. Chế độ có hướng dẫn Ván đầu tiên giúp bạn học bỏ phiếu chọn Đội và thẻ Nhiệm vụ mà không cần tổ chức đủ nhóm. Quan sát cách một Nhiệm vụ Thành công tạo lòng tin mà chưa chứng minh ai đó thuộc phe Thiện.',
          'Ván với bot còn cho bạn tìm hiểu Merlin và lượt Ám sát cuối ván trước khi hướng dẫn bạn bè. Bạn cũng có thể mời bạn bè và để bot lấp chỗ trống. Chọn số chỗ và chế độ trong phần thiết lập; phần này hiển thị tình trạng hiện tại và đánh dấu số chỗ yêu cầu Premium.',
        ],
      },
      {
        title: 'Có thể chơi trò thay thế Secret Hitler này trên trình duyệt không?',
        paragraphs: [
          'Có. Avalon tại đây chạy trên trình duyệt mà không cần tải ứng dụng. Để chơi ván thông thường miễn phí giữa người thật, tập hợp 5–10 người, để mọi người đăng nhập trên thiết bị riêng, rồi tạo phòng và chia sẻ liên kết. Chơi trên trình duyệt không khiến hai trò giống hệt nhau: Avalon có Nhiệm vụ và Merlin thay cho bộ chính sách và quyền lực chính phủ.',
          'Bạn không cần đủ nhóm người thật để học sự khác biệt. Chọn Chơi một mình hoặc Ván đầu tiên trong phần thiết lập AI, hoặc chọn Với bạn bè để bot lấp chỗ trống. Cần có tài khoản; xem tình trạng hiện tại và số chỗ được đánh dấu Premium trước khi bắt đầu. Quyền chơi với AI có điều kiện riêng so với các phòng thông thường miễn phí giữa người thật.',
        ],
      },
    ],
  },
  avalon_vs_werewolf: {
    slug: 'avalon-vs-werewolf',
    breadcrumb: 'Avalon và Ma Sói',
    title: 'Trò chơi giống Ma Sói và Mafia: so sánh với Avalon',
    lead: 'Nếu thích các trò ẩn vai như Ma Sói và Mafia, hãy thử Avalon: 5–10 người bạn bỏ phiếu chọn Đội làm Nhiệm vụ thay vì loại người bị nghi ngờ. Mọi người đều tham gia suốt các Nhiệm vụ. Ma Sói một đêm là một lựa chọn riêng khác không loại người chơi sớm.',
    table: {
      caption: 'So sánh Ma Sói hoặc Mafia cổ điển với Avalon cơ bản',
      columns: ['Yếu tố trò chơi', 'Ma Sói / Mafia cổ điển', 'Avalon'],
      rows: [
        {
          title: 'Quyết định của nhóm',
          cells: ['Bỏ phiếu loại một người bị nghi ngờ.', 'Tán thành hoặc Phản đối Đội làm Nhiệm vụ được đề cử.'],
        },
        {
          title: 'Hành động bí mật',
          cells: [
            'Hành động ban đêm như tấn công và điều tra; chi tiết tùy bộ luật.',
            'Người được chọn nộp thẻ Nhiệm vụ Thành công hoặc Thất bại.',
          ],
        },
        {
          title: 'Khi bạn bị nghi ngờ',
          cells: [
            'Bị loại có thể chấm dứt việc tham gia tích cực của bạn.',
            'Bạn vẫn tham gia thảo luận và mọi lần bỏ phiếu chọn Đội.',
          ],
        },
        {
          title: 'Bằng chứng qua từng lượt',
          cells: [
            'Thảo luận, phiếu bầu, kết quả ban đêm và thông tin vai trò.',
            'Đề cử Đội, phiếu Tán thành công khai và kết quả Nhiệm vụ.',
          ],
        },
        {
          title: 'Quản trò',
          cells: [
            'Ván cổ điển chơi trực tiếp thường có quản trò; công cụ trực tuyến có thể xử lý hành động.',
            'Nền tảng này xử lý vai bí mật, phiếu bầu và kết quả Nhiệm vụ.',
          ],
        },
      ],
    },
    sections: [
      {
        title: 'Loại người hay bỏ phiếu Nhiệm vụ: mọi người có được chơi tiếp không?',
        paragraphs: [
          'Trong Ma Sói cổ điển, dân làng thảo luận về người đáng ngờ vào ban ngày và kẻ địch ẩn mình hành động ban đêm. Người bị loại thường ngừng tham gia thảo luận và bỏ phiếu trong ván. Mafia có nhiều luật địa phương, nên hãy thống nhất phiên bản thay vì cho rằng mọi vai trò và điều kiện thắng đều giống nhau.',
          'Trong Avalon, không chọn ai đó vào Đội không loại họ khỏi ván chơi. Họ có thể chất vấn đề xuất, bỏ phiếu và trở thành Đội trưởng tiếp theo. Ngay cả người bị cả nhóm nghi ngờ vẫn có thể ảnh hưởng kết quả, khiến nhóm phải xử lý sự nghi ngờ theo cách khác.',
        ],
        source: werewolfRules,
      },
      {
        title: 'Điều gì thay thế việc bỏ phiếu loại người đáng ngờ?',
        paragraphs: [
          'Thay vì dừng ở câu “Alice có vẻ là Ác”, hãy hỏi bạn sẽ Tán thành Đội nào và vì sao. Trong ván năm người, Nhiệm vụ đầu cần hai người và ít nhất ba trong năm người phải Tán thành. Chỉ cặp đôi được chọn quyết định thẻ Nhiệm vụ; mọi người đều được đánh giá kết quả.',
          'Một thẻ Thất bại trong Nhiệm vụ của trò cơ bản nghĩa là ít nhất một thành viên thuộc phe Ác. Nó không tiết lộ ai đã phá hoại. Thẻ Thành công không minh oan cho cả hai thành viên, vì phe Ác có thể chọn Thành công. Tiếp tục so sánh Đội mỗi người đề cử và phiếu bầu của họ thay vì coi một kết quả là chắc chắn.',
        ],
      },
      {
        title: 'Merlin không phải Tiên tri điều tra mỗi đêm',
        paragraphs: [
          'Tiên tri trong Ma Sói cổ điển biết thông tin qua hành động ban đêm. Merlin của Avalon nhận thông tin ngay khi thiết lập, với ngoại lệ cho những vai như Mordred. Avalon cơ bản không có điều tra ban đêm lặp lại. Thử thách của Merlin là giúp phe Thiện mà không bị nhận diện.',
          'Sau ba Nhiệm vụ Thất bại, phe Ác thắng. Sau ba Nhiệm vụ Thành công, phe Ác vẫn có một lần Ám sát Merlin. Đó là quyết định cuối ván, không phải loại sớm rồi tiếp tục nhiều vòng thiếu người bị nhắm tới.',
        ],
      },
      {
        title: 'Ma Sói một đêm có tránh loại người chơi sớm không?',
        paragraphs: [
          'One Night Ultimate Werewolf, hay Ma Sói một đêm, vốn không loại người chơi sớm và không cần quản trò. Trò này diễn ra trong một đêm và cuộc thảo luận tiếp theo, thay vì chu kỳ ngày đêm lặp lại của Ma Sói cổ điển. Nếu nhóm đã chơi Ma Sói một đêm, Avalon mang đến chuỗi bỏ phiếu Nhiệm vụ và kết quả, chứ không phải trò duy nhất giữ mọi người cùng tham gia.',
        ],
        source: oneNight,
      },
      {
        title: 'Khi nào nên chọn Avalon, Ma Sói hoặc Mafia?',
        paragraphs: [
          'Chọn ván Avalon thông thường giữa người thật nếu thích thảo luận liên tục, nhóm cố định 5–10 người và nhiều cơ hội thử các Đội. Ván Avalon với bot cũng cho bạn thử những quyết định Nhiệm vụ đó một mình hoặc cùng bạn bè. Chọn Ma Sói cổ điển hoặc Mafia nếu nhóm thích năng lực ban đêm, loại người bị nghi ngờ và số người chơi thay đổi. Ma Sói cũng có phiên bản trực tuyến, kể cả lựa chọn trình duyệt được liên kết tại đây.',
          'Để đổi trò, trước hết hướng dẫn bỏ phiếu chọn Đội và thẻ Nhiệm vụ, sau đó giải thích Merlin và Ám sát. Dùng bảng số người và vai trò trong luật chơi Avalon của chúng tôi thay vì áp dụng cách cân bằng vai trò của Mafia cho Avalon.',
        ],
        source: browserWerewolf,
      },
      {
        title: 'Tập chơi Avalon với bot trước khi mời nhóm Mafia',
        paragraphs: [
          'Thử Chơi một mình hoặc chế độ có hướng dẫn Ván đầu tiên để thay việc bỏ phiếu loại người quen thuộc bằng bỏ phiếu chọn Đội làm Nhiệm vụ. Bot lấp đầy bàn chơi, còn bạn tự đưa ra quyết định thảo luận và trên bàn chơi. Chú ý rằng dù không được chọn vào Nhiệm vụ, bạn vẫn có thể bỏ phiếu và theo dõi kết quả.',
          'Dùng ván đó để hiểu thông tin ban đầu của Merlin và quyết định Ám sát, rồi chia sẻ điều đã học với nhóm Ma Sói hoặc Mafia. Hoặc mời bạn bè và để bot lấp chỗ trống. Chọn số chỗ, chế độ và ngôn ngữ thảo luận được hỗ trợ trong phần thiết lập, nơi hiển thị tình trạng hiện tại.',
        ],
      },
      {
        title: 'Có thể thử trò không loại người chơi trực tuyến mà không tải xuống không?',
        paragraphs: [
          'Avalon tại đây chạy trên trình duyệt và xử lý vai bí mật, bỏ phiếu chọn Đội cùng kết quả Nhiệm vụ. Bạn không cần ứng dụng hay một người riêng để xử lý những hành động đó. Với phòng thông thường giữa người thật, mỗi người trong nhóm 5–10 người cần tài khoản và thiết bị riêng; các ván đó miễn phí. Thống nhất thảo luận bằng văn bản hay giọng nói trước khi chia sẻ liên kết phòng.',
          'Nếu muốn thử bỏ phiếu Nhiệm vụ trước khi tổ chức nhóm Mafia, hãy chơi một mình với bot hoặc mời bạn bè và để bot lấp chỗ trống. Phần thiết lập AI hiển thị chế độ hiện có, ngôn ngữ thảo luận được hỗ trợ và số chỗ yêu cầu Premium. Chơi với bot cần tài khoản và có tình trạng cung cấp riêng; hãy kiểm tra riêng số chỗ AI thay vì suy từ giới hạn 5–10 người của ván người thật.',
        ],
      },
    ],
  },
};

export const copy: GuideCopy = {
  home: 'Trang chủ',
  breadcrumbLabel: 'Đường dẫn điều hướng',
  tocTitle: 'Trong bài viết này',
  comparisonLabel: 'So sánh các trò chơi',
  setupLabel: 'Điều kiện tham gia và cách bắt đầu',
  aiAccessNote: 'Cần tài khoản. Xem phần thiết lập để biết ngôn ngữ, chế độ và quyền chơi Premium.',
  setupTitle: 'Chơi Avalon tại đây: bạn bè hoặc bot',
  humanTitle: 'Ván thông thường với bạn bè là người thật',
  playersLabel: 'Người chơi',
  humanPlayers: '5–10 người thật, mỗi người dùng thiết bị riêng.',
  accessLabel: 'Điều kiện tham gia',
  humanAccess: 'Ván miễn phí trên trình duyệt. Mỗi người chơi cần tài khoản.',
  discussionLabel: 'Thảo luận',
  humanDiscussion: 'Trò chuyện văn bản và trò chuyện thoại tùy chọn (thử nghiệm).',
  findingGroupLabel: 'Tìm nhóm',
  findingGroup: 'Hẹn chơi với bạn bè hoặc dùng bảng người chơi và bảng nhóm.',
  boardsNote: 'Các bảng giúp bạn phối hợp; chúng không bảo đảm ghép trận ngay lập tức.',
  aiTitle: 'Thử một mình hoặc cùng bạn bè và bot',
  aiIntro:
    'Chơi một mình hoặc mời bạn bè và để bot lấp chỗ trống. Chọn số chỗ và chế độ trong phần thiết lập. Mới chơi Avalon? Thử chế độ có hướng dẫn Ván đầu tiên.',
  aiAvailability:
    'Bạn cần tài khoản. Bot hỗ trợ thảo luận bằng tiếng Anh, tiếng Nga, tiếng Trung phồn thể, tiếng Tây Ban Nha và tiếng Việt. Chọn chế độ trong phần thiết lập; phần này hiển thị tình trạng hiện tại và đánh dấu số chỗ yêu cầu Premium.',
  startLabel: 'Bắt đầu chơi Avalon',
  aiCta: 'Thử một ván với bot',
  lobbyCta: 'Mở sảnh Avalon',
  findGroupCta: 'Tìm nhóm',
  rulesCta: 'Tìm hiểu luật chơi Avalon và bỏ phiếu Nhiệm vụ',
  sourceLabel: 'Nguồn',
  variantTitle: 'Hai quy tắc cần kiểm tra trước ván đầu',
  proposalVariant:
    'Trong bản cờ bàn Avalon gốc, năm Đội bị Phản đối liên tiếp sẽ khiến phe Ác thắng. Tại đây, sau bốn đề xuất bị bác bỏ, Đội thứ năm thường đi làm Nhiệm vụ mà không cần bỏ phiếu; Thẻ âm mưu có thể ảnh hưởng việc thông qua.',
  assassinationVariant:
    'Trò gốc giao quyết định cuối cùng đoán ai là Merlin cho Sát thủ sau khi phe Ác thảo luận. Trong các phòng thông thường giữa người thật tại đây, phe Ác cùng xử lý Ám sát. Ván với bot cũng có hội đồng phe Ác trước quyết định Ám sát. Vai tùy chọn và vai tùy chỉnh có thể thay đổi mục tiêu hợp lệ, nên hãy kiểm tra thiết lập phòng.',
  fullRulesCta: 'Đọc luật chơi Avalon, số người làm Nhiệm vụ và cách chia vai',
  previewAlt: 'Bàn chơi Avalon với tám chỗ người chơi và kết quả các Nhiệm vụ',
  previewCaption: 'Bàn chơi Avalon hiển thị kết quả Nhiệm vụ, từ hình xem trước ván chơi có sẵn trên trang.',
  nextTitle: 'Bắt đầu với bot hoặc rủ bạn bè',
  nextAi:
    'Muốn học trước khi mời đủ nhóm? Mở Chơi với AI trong sảnh, xem các chế độ hiện có rồi chọn Chơi một mình hoặc chế độ có hướng dẫn Ván đầu tiên. Để mời bạn bè, chọn Với bạn bè và chia sẻ liên kết phòng đã chuẩn bị để họ tham gia trước khi bạn bắt đầu.',
  nextHuman:
    'Nhờ 5–10 người bạn tạo tài khoản, thống nhất ngôn ngữ và cách trò chuyện, rồi mở sảnh và tạo phòng. Chia sẻ liên kết với nhóm. Mới chơi Avalon? Hướng dẫn bỏ phiếu chọn Đội và thẻ Nhiệm vụ trước khi thêm vai tùy chọn.',
  arrangeLabel: 'Chơi hoặc tổ chức một ván Avalon',
  browseGroupsCta: 'Xem các nhóm Avalon',
  findPlayersCta: 'Tìm người chơi Avalon',
  merlinCta: 'Tìm hiểu Merlin thấy ai và cách Ám sát hoạt động',
  relatedLabel: 'Hướng dẫn suy luận xã hội khác',
  relatedTitle: 'So sánh Avalon với các trò suy luận xã hội khác',
  ownership: 'Tên trò chơi thuộc về chủ sở hữu tương ứng. Phần so sánh này không hàm ý họ chứng thực nền tảng này.',
};
