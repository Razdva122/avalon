const en = {
  showQR: 'Show QR code',
  hideQR: 'Hide QR code',
  qrHint: 'Scan with your wallet. Select the network shown above; the QR contains only the recipient address.',
  qrFailed: 'Could not generate the QR code. Copy the address instead.',

  network: 'Coin and network',
  recipient: 'Recipient address',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Select and copy the address manually.',
  tokenContract: 'Accepted token contract',
  txid: 'Transaction hash (txid)',
  txidHint:
    'Copy the transaction hash from your wallet or exchange withdrawal history. Enter the hash, not a wallet address or link. If you cannot find it, contact the project team.',
  pay: 'Check my transfer',
  paymentHint:
    'Send any amount to this address using the selected network, then enter your txid below. We credit the amount actually received, excluding network fees.',
  btcConfirmation:
    'BTC is credited after 1 confirmation. The USD value uses the exchange rate when the site verifies your transfer.',
  tokenConfirmation:
    'USDT is credited after network confirmation at $1 per token. Use the exact token and network shown above.',
  claimSaved: 'Transfer request saved.',
  premiumDescription:
    'Receive lifetime Premium after $10 in confirmed support. USDT counts at $1; BTC is valued when the site verifies the transfer.',
  anonymousHint: 'The feed shows “Anonymous”, the credited amount and date. Blockchain transfers remain public.',
  history: 'Your recent transfers',
  noHistory: 'You have not submitted any transfers yet.',
  pendingHint:
    'We keep checking after you close this page. Automatic checks stop 1 hour after you submit the txid; you can check again manually. For a disputed transfer, contact the team with the request ID.',
  invalidTxid: 'Enter the full transaction hash for the selected network.',
  alreadyClaimed: 'This transfer has already been credited. If it is yours, contact the project team to resolve it.',
  rateError: 'Please wait one minute before submitting or checking another transfer.',
  waiting: 'Transfer not found yet — checking again automatically',
  confirming: 'Waiting for network confirmation',
  finished: 'Credited',
  provider_unavailable: 'Verification is temporarily unavailable — we will retry',
  check_expired: 'Automatic checking stopped — check again or contact the team',
  rejected: 'No successful transfer of this asset to our address was found',
  duplicate: 'Transfer already credited — contact the team if this is yours',
};
const ru: typeof en = {
  showQR: 'Показать QR-код',
  hideQR: 'Скрыть QR-код',
  qrHint: 'Отсканируйте кошельком. Выберите указанную выше сеть: QR содержит только адрес получателя.',
  qrFailed: 'Не удалось создать QR-код. Скопируйте адрес.',

  network: 'Монета и сеть',
  recipient: 'Адрес получателя',
  copy: 'Скопировать',
  copied: 'Скопировано',
  copyFailed: 'Выделите адрес и скопируйте его вручную.',
  tokenContract: 'Контракт принимаемого токена',
  txid: 'Хеш транзакции (txid)',
  txidHint:
    'Скопируйте хеш транзакции из истории кошелька или вывода с биржи. Нужен сам хеш, а не адрес кошелька или ссылка. Если не получается найти — напишите команде проекта.',
  pay: 'Проверить мой перевод',
  paymentHint:
    'Переведите любую сумму на этот адрес в выбранной сети, затем укажите txid ниже. Начислим фактически полученную сумму без комиссии сети.',
  btcConfirmation:
    'Для BTC достаточно 1 подтверждения. Сумму в долларах рассчитаем по курсу при проверке перевода сайтом.',
  tokenConfirmation:
    'USDT начисляется после подтверждения сети по $1 за токен. Используйте именно указанные выше токен и сеть.',
  claimSaved: 'Заявка на перевод сохранена.',
  premiumDescription:
    'Накопите $10 подтверждённой поддержки и получите Premium навсегда. USDT учитывается по $1, BTC — по курсу при проверке перевода сайтом.',
  anonymousHint: 'В ленте будут «Аноним», начисленная сумма и дата. Переводы в блокчейне остаются публичными.',
  history: 'Ваши последние переводы',
  noHistory: 'Вы ещё не добавляли переводы.',
  pendingHint:
    'Проверяем перевод и после закрытия страницы. Через час после подачи txid автоматические проверки прекращаются — можно проверить вручную. Для спорного перевода напишите команде, указав номер заявки.',
  invalidTxid: 'Введите полный хеш транзакции в выбранной сети.',
  alreadyClaimed: 'Этот перевод уже учтён. Если он ваш, напишите команде проекта — разберёмся вручную.',
  rateError: 'Подождите минуту перед добавлением или повторной проверкой перевода.',
  waiting: 'Перевод пока не найден — проверим автоматически',
  confirming: 'Ожидаем подтверждения сети',
  finished: 'Начислено',
  provider_unavailable: 'Проверка временно недоступна — повторим автоматически',
  check_expired: 'Автопроверка завершена — проверьте вручную или напишите команде',
  rejected: 'Успешный перевод этого актива на наш адрес не найден',
  duplicate: 'Перевод уже учтён — если он ваш, напишите команде',
};
const es: typeof en = {
  showQR: 'Mostrar código QR',
  hideQR: 'Ocultar código QR',
  qrHint:
    'Escanea con tu billetera. Selecciona la red indicada arriba; el QR solo contiene la dirección del destinatario.',
  qrFailed: 'No se pudo generar el QR. Copia la dirección.',

  network: 'Moneda y red',
  recipient: 'Dirección de destino',
  copy: 'Copiar',
  copied: 'Copiado',
  copyFailed: 'Selecciona y copia la dirección manualmente.',
  tokenContract: 'Contrato del token aceptado',
  txid: 'Hash de transacción (txid)',
  txidHint:
    'Copia el hash desde el historial de tu cartera o de retiros del exchange. Introduce el hash, no una dirección ni un enlace. Si no lo encuentras, contacta con el equipo.',
  pay: 'Comprobar mi transferencia',
  paymentHint:
    'Envía cualquier importe a esta dirección en la red seleccionada e introduce el txid. Se acredita lo recibido, sin las comisiones de red.',
  btcConfirmation:
    'BTC se acredita tras 1 confirmación. El valor en USD usa la cotización cuando el sitio verifica la transferencia.',
  tokenConfirmation: 'USDT se acredita tras la confirmación de la red a $1 por token. Usa el token y la red indicados.',
  claimSaved: 'Solicitud guardada.',
  premiumDescription:
    'Consigue Premium permanente con $10 de apoyo confirmado. USDT cuenta a $1; BTC se valora cuando el sitio verifica la transferencia.',
  anonymousHint:
    'La lista muestra «Anónimo», el importe acreditado y la fecha. Las transferencias de blockchain siguen siendo públicas.',
  history: 'Tus últimas transferencias',
  noHistory: 'Todavía no has registrado transferencias.',
  pendingHint:
    'Seguimos comprobando aunque cierres la página. Una hora después de enviar el txid puedes volver a comprobar manualmente. Para resolver una disputa, envía al equipo el ID de la solicitud.',
  invalidTxid: 'Introduce el hash completo de la transacción en la red seleccionada.',
  alreadyClaimed: 'Esta transferencia ya fue acreditada. Si es tuya, contacta con el equipo.',
  rateError: 'Espera un minuto antes de registrar o comprobar otra transferencia.',
  waiting: 'Transferencia aún no encontrada; volveremos a comprobar',
  confirming: 'Esperando confirmación de la red',
  finished: 'Acreditado',
  provider_unavailable: 'Verificación temporalmente no disponible; volveremos a intentarlo',
  check_expired: 'Comprobación automática detenida; comprueba manualmente o contacta con el equipo',
  rejected: 'No se encontró una transferencia válida de este activo a nuestra dirección',
  duplicate: 'Transferencia ya acreditada; contacta con el equipo si es tuya',
};
const pt: typeof en = {
  showQR: 'Mostrar código QR',
  hideQR: 'Ocultar código QR',
  qrHint: 'Escaneie com sua carteira. Selecione a rede acima; o QR contém apenas o endereço do destinatário.',
  qrFailed: 'Não foi possível gerar o QR. Copie o endereço.',

  network: 'Moeda e rede',
  recipient: 'Endereço de destino',
  copy: 'Copiar',
  copied: 'Copiado',
  copyFailed: 'Selecione e copie o endereço manualmente.',
  tokenContract: 'Contrato do token aceito',
  txid: 'Hash da transação (txid)',
  txidHint:
    'Copie o hash do histórico da carteira ou de saques da corretora. Informe o hash, não um endereço ou link. Se não encontrar, fale com a equipe.',
  pay: 'Verificar minha transferência',
  paymentHint:
    'Envie qualquer valor para este endereço na rede escolhida e informe o txid. Creditamos o valor recebido, sem as taxas da rede.',
  btcConfirmation:
    'BTC é creditado após 1 confirmação. O valor em USD usa a cotação no momento da verificação pelo site.',
  tokenConfirmation: 'USDT é creditado após a confirmação da rede a US$ 1 por token. Use o token e a rede indicados.',
  claimSaved: 'Solicitação salva.',
  premiumDescription:
    'Receba Premium vitalício ao acumular US$ 10 em apoio confirmado. USDT conta a US$ 1; BTC usa a cotação no momento da verificação pelo site.',
  anonymousHint:
    'A lista mostra “Anônimo”, o valor creditado e a data. As transferências na blockchain continuam públicas.',
  history: 'Suas últimas transferências',
  noHistory: 'Você ainda não registrou transferências.',
  pendingHint:
    'Continuamos verificando após você fechar a página. Uma hora após enviar o txid, verifique novamente manualmente. Para resolver uma disputa, envie à equipe o ID da solicitação.',
  invalidTxid: 'Informe o hash completo da transação na rede escolhida.',
  alreadyClaimed: 'Esta transferência já foi creditada. Se for sua, fale com a equipe.',
  rateError: 'Aguarde um minuto antes de registrar ou verificar outra transferência.',
  waiting: 'Transferência ainda não encontrada; verificaremos novamente',
  confirming: 'Aguardando confirmação da rede',
  finished: 'Creditado',
  provider_unavailable: 'Verificação temporariamente indisponível; tentaremos novamente',
  check_expired: 'Verificação automática encerrada; verifique manualmente ou fale com a equipe',
  rejected: 'Não encontramos uma transferência válida deste ativo para nosso endereço',
  duplicate: 'Transferência já creditada; fale com a equipe se for sua',
};
const zhCN: typeof en = {
  showQR: '显示二维码',
  hideQR: '隐藏二维码',
  qrHint: '使用钱包扫码。请选择上方所示网络；二维码仅包含收款地址。',
  qrFailed: '无法生成二维码，请复制地址。',

  network: '币种与网络',
  recipient: '收款地址',
  copy: '复制',
  copied: '已复制',
  copyFailed: '请选择地址并手动复制。',
  tokenContract: '接受的代币合约',
  txid: '交易哈希（txid）',
  txidHint:
    '从钱包交易记录或交易所提币记录复制交易哈希。请输入哈希本身，不是钱包地址或链接。如找不到，请联系项目团队。',
  pay: '查询我的转账',
  paymentHint: '使用所选网络向此地址转账任意金额，然后填写 txid。按实际到账金额计入，不含网络手续费。',
  btcConfirmation: 'BTC 获得 1 次确认后计入。美元金额按网站核验转账时的汇率计算。',
  tokenConfirmation: 'USDT 经网络确认后按每枚 1 美元计入。请使用上方指定的代币和网络。',
  claimSaved: '转账申请已保存。',
  premiumDescription: '累计确认支持达到 10 美元即可获得永久 Premium。USDT 按 1 美元计入，BTC 按网站核验时的汇率计算。',
  anonymousHint: '列表显示“匿名”、计入金额和日期。区块链转账记录仍然公开。',
  history: '您的近期转账',
  noHistory: '您尚未提交转账。',
  pendingHint:
    '关闭页面后仍会继续查询。提交交易哈希 1 小时后停止自动查询，可手动重试。如有争议，请向团队提供申请编号。',
  invalidTxid: '请输入所选网络的完整交易哈希。',
  alreadyClaimed: '此转账已计入。如为您的转账，请联系团队处理。',
  rateError: '请等待一分钟后再提交或查询转账。',
  waiting: '暂未找到转账，将自动重试',
  confirming: '等待网络确认',
  finished: '已计入',
  provider_unavailable: '暂时无法核验，将自动重试',
  check_expired: '自动查询已停止，请手动查询或联系团队',
  rejected: '未找到向我们地址成功转入此资产的记录',
  duplicate: '转账已计入，如为您的转账请联系团队',
};
const zhTW: typeof en = {
  showQR: '顯示 QR 碼',
  hideQR: '隱藏 QR 碼',
  qrHint: '使用錢包掃碼。請選擇上方所示網路；QR 碼僅包含收款地址。',
  qrFailed: '無法產生 QR 碼，請複製地址。',

  network: '幣種與網路',
  recipient: '收款地址',
  copy: '複製',
  copied: '已複製',
  copyFailed: '請選取地址並手動複製。',
  tokenContract: '接受的代幣合約',
  txid: '交易雜湊（txid）',
  txidHint:
    '從錢包交易紀錄或交易所提幣紀錄複製交易雜湊。請輸入雜湊本身，不是錢包地址或連結。如找不到，請聯絡專案團隊。',
  pay: '查詢我的轉帳',
  paymentHint: '使用所選網路向此地址轉帳任意金額，然後填寫 txid。依實際到帳金額計入，不含網路手續費。',
  btcConfirmation: 'BTC 獲得 1 次確認後計入。美元金額依網站核驗轉帳時的匯率計算。',
  tokenConfirmation: 'USDT 經網路確認後依每枚 1 美元計入。請使用上方指定的代幣和網路。',
  claimSaved: '轉帳申請已儲存。',
  premiumDescription: '累計確認支持達到 10 美元即可獲得永久 Premium。USDT 依 1 美元計入，BTC 依網站核驗時的匯率計算。',
  anonymousHint: '列表顯示「匿名」、計入金額和日期。區塊鏈轉帳紀錄仍然公開。',
  history: '您的近期轉帳',
  noHistory: '您尚未提交轉帳。',
  pendingHint:
    '關閉頁面後仍會繼續查詢。提交交易雜湊 1 小時後停止自動查詢，可手動重試。如有爭議，請向團隊提供申請編號。',
  invalidTxid: '請輸入所選網路的完整交易雜湊。',
  alreadyClaimed: '此轉帳已計入。如為您的轉帳，請聯絡團隊處理。',
  rateError: '請等待一分鐘後再提交或查詢轉帳。',
  waiting: '暫未找到轉帳，將自動重試',
  confirming: '等待網路確認',
  finished: '已計入',
  provider_unavailable: '暫時無法核驗，將自動重試',
  check_expired: '自動查詢已停止，請手動查詢或聯絡團隊',
  rejected: '未找到向我們地址成功轉入此資產的紀錄',
  duplicate: '轉帳已計入，如為您的轉帳請聯絡團隊',
};
export const directSupport = { en, ru, es, pt, zhCN, zhTW };
