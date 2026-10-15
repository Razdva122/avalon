import { vi } from 'vuetify/locale';

export default {
  ...vi,
  open: 'Mở',
  dismiss: 'Bỏ qua',
  confirmEdit: {
    ...vi.confirmEdit,
    ok: 'Xác nhận',
    cancel: 'Hủy',
  },
  dateRangeInput: {
    ...vi.dateRangeInput,
    divider: 'đến',
  },
  datePicker: {
    ...vi.datePicker,
    itemsSelected: 'Đã chọn {0}',
    range: {
      ...vi.datePicker.range,
      title: 'Chọn khoảng ngày',
      header: 'Nhập khoảng ngày',
    },
    title: 'Chọn ngày',
    header: 'Nhập ngày',
    input: {
      ...vi.datePicker.input,
      placeholder: 'Nhập ngày',
    },
  },
  carousel: {
    ...vi.carousel,
    prev: 'Hình trước',
    next: 'Hình tiếp theo',
    ariaLabel: {
      ...vi.carousel.ariaLabel,
      delimiter: 'Hình {0} trên {1}',
    },
  },
  calendar: {
    ...vi.calendar,
    today: 'Hôm nay',
  },
  input: {
    ...vi.input,
    clear: 'Xóa {0}',
    prependAction: 'Thao tác ở đầu ô {0}',
    appendAction: 'Thao tác ở cuối ô {0}',
    otp: 'Vui lòng nhập ký tự thứ {0} của mã OTP',
  },
  fileUpload: {
    ...vi.fileUpload,
    title: 'Kéo và thả tệp vào đây',
    divider: 'hoặc',
    browse: 'Chọn tệp',
  },
  timePicker: {
    ...vi.timePicker,
    title: 'Chọn giờ',
  },
  pagination: {
    ...vi.pagination,
    ariaLabel: {
      ...vi.pagination.ariaLabel,
      first: 'Trang đầu',
      last: 'Trang cuối',
    },
  },
  stepper: {
    ...vi.stepper,
    next: 'Tiếp theo',
    prev: 'Trước đó',
  },
  loading: 'Đang tải...',
  infiniteScroll: {
    ...vi.infiniteScroll,
    loadMore: 'Tải thêm',
    empty: 'Không còn mục nào',
  },
};
