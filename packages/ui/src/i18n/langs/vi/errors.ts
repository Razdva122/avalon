export default {
  errors: {
    rateLimited: 'Quá nhiều yêu cầu. Vui lòng đợi rồi thử lại.',
    invalidRequest: 'Vui lòng kiểm tra thông tin bạn đã nhập.',
    requestFailed: 'Yêu cầu không thành công. Vui lòng thử lại.',
    roomLimit: 'Đã đạt giới hạn số phòng. Vui lòng thử lại sau.',
    forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    wrongPassword: 'Tên đăng nhập, email hoặc mật khẩu không đúng.',
    emailNotExist: 'Không tìm thấy người dùng có email này',
    loginNotExist: 'Không tìm thấy người dùng có tên đăng nhập này',
    emailAlreadyExist: 'Email này đã được đăng ký',
    loginAlreadyExist: 'Tên đăng nhập này đã được đăng ký',
    avatarNotExist: 'Ảnh đại diện không tồn tại',
    avatarNotAvailable: 'Bạn chưa thể sử dụng ảnh đại diện này',
  },
  validators: {
    maxCharacters: 'Tối đa {count} ký tự',
    invalidName: 'Nhập tên không có ký tự điều khiển.',
    requiredField: 'Thông tin bắt buộc',
    minCharacters: 'Tối thiểu {count} ký tự',
    spacesForbidden: 'Không được có khoảng trắng',
    loginSymbols: 'Cho phép: a-z, 0-9, _ . -',
  },
};
