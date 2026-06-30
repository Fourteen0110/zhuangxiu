/**
 * 家电家具尺寸统计模块
 * CRUD、按房间/类别分类、尺寸汇总、搜索筛选
 */
const FurnitureModule = (() => {
  const STORE_KEY = 'furniture';
  const ROOMS = ['客厅', '主卧', '次卧', '儿童房', '厨房', '主卫', '次卫', '阳台', '书房', '玄关', '餐厅', '储物间', '其他'];
  const TYPES = ['大家电', '小家电', '家具', '灯具', '卫浴', '软装', '五金配件', '其他'];

  const STATUS_OPTIONS = ['待购', '已购', '已到货', '已安装'];
  // 预设全屋家电家具清单（含常见尺寸参考）
  const DEFAULT_ITEMS = [
    // ===== 客厅 =====
    { name: '沙发', type: '家具', room: '客厅', brand: '', model: '', length: 280, width: 95, height: 85, qty: 1, price: null, status: '待购', link: '', note: '三人位+贵妃位，根据客厅面积选择' },
    { name: '茶几', type: '家具', room: '客厅', brand: '', model: '', length: 120, width: 60, height: 42, qty: 1, price: null, status: '待购', link: '', note: '岩板/实木，注意与沙发高度匹配' },
    { name: '电视柜', type: '家具', room: '客厅', brand: '', model: '', length: 200, width: 40, height: 45, qty: 1, price: null, status: '待购', link: '', note: '根据电视尺寸选择长度' },
    { name: '电视机', type: '大家电', room: '客厅', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '65/75/85寸，视距3-4m选75寸' },
    { name: '空调（客厅）', type: '大家电', room: '客厅', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '3匹柜机或风管机，30-40㎡适用' },
    { name: '落地灯', type: '灯具', room: '客厅', brand: '', model: '', length: null, width: null, height: 160, qty: 1, price: null, status: '待购', link: '', note: '阅读角/沙发旁氛围照明' },
    { name: '主灯（客厅）', type: '灯具', room: '客厅', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '吸顶灯/吊灯/无主灯设计' },
    { name: '地毯', type: '软装', room: '客厅', brand: '', model: '', length: 200, width: 300, height: null, qty: 1, price: null, status: '待购', link: '', note: '比沙发略大一圈即可' },
    { name: '窗帘（客厅）', type: '软装', room: '客厅', brand: '', model: '', length: null, width: null, height: 270, qty: 1, price: null, status: '待购', link: '', note: '根据窗宽定制，帘宽=窗宽×2' },
    { name: '路由器/AP面板', type: '小家电', room: '客厅', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: 'Mesh组网或AC+AP方案' },
    { name: '扫地机器人', type: '小家电', room: '客厅', brand: '', model: '', length: 35, width: 35, height: 10, qty: 1, price: null, status: '待购', link: '', note: '需预留充电桩位置和插座' },

    // ===== 餐厅 =====
    { name: '餐桌', type: '家具', room: '餐厅', brand: '', model: '', length: 140, width: 80, height: 75, qty: 1, price: null, status: '待购', link: '', note: '岩板/实木，4人用140cm，6人用160cm' },
    { name: '餐椅', type: '家具', room: '餐厅', brand: '', model: '', length: 45, width: 45, height: 85, qty: 4, price: null, status: '待购', link: '', note: '与餐桌风格统一' },
    { name: '餐边柜', type: '家具', room: '餐厅', brand: '', model: '', length: 120, width: 40, height: 90, qty: 1, price: null, status: '待购', link: '', note: '可嵌入蒸烤箱/咖啡机' },
    { name: '餐厅吊灯', type: '灯具', room: '餐厅', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '吊灯距桌面70-80cm' },

    // ===== 主卧 =====
    { name: '床（主卧）', type: '家具', room: '主卧', brand: '', model: '', length: 200, width: 180, height: 95, qty: 1, price: null, status: '待购', link: '', note: '1.8m×2m，含床头靠背' },
    { name: '床垫（主卧）', type: '家具', room: '主卧', brand: '', model: '', length: 200, width: 180, height: 25, qty: 1, price: null, status: '待购', link: '', note: '独立袋装弹簧+乳胶/记忆棉' },
    { name: '床头柜', type: '家具', room: '主卧', brand: '', model: '', length: 45, width: 40, height: 50, qty: 2, price: null, status: '待购', link: '', note: '与床齐高或略低' },
    { name: '衣柜（主卧）', type: '家具', room: '主卧', brand: '', model: '', length: 200, width: 60, height: 240, qty: 1, price: null, status: '待购', link: '', note: '定制通顶衣柜，深度≥55cm' },
    { name: '梳妆台', type: '家具', room: '主卧', brand: '', model: '', length: 100, width: 45, height: 75, qty: 1, price: null, status: '待购', link: '', note: '配梳妆镜+LED灯带' },
    { name: '空调（主卧）', type: '大家电', room: '主卧', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '1.5匹挂机，15-20㎡适用' },
    { name: '主灯（主卧）', type: '灯具', room: '主卧', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '吸顶灯，色温3000K暖光' },
    { name: '床头壁灯/吊灯', type: '灯具', room: '主卧', brand: '', model: '', length: null, width: null, height: null, qty: 2, price: null, status: '待购', link: '', note: '阅读灯，距地面120-140cm' },
    { name: '窗帘（主卧）', type: '软装', room: '主卧', brand: '', model: '', length: null, width: null, height: 270, qty: 1, price: null, status: '待购', link: '', note: '建议遮光率90%+，含纱帘' },
    { name: '全身镜', type: '家具', room: '主卧', brand: '', model: '', length: null, width: null, height: 160, qty: 1, price: null, status: '待购', link: '', note: '落地镜或衣柜内置' },

    // ===== 次卧/儿童房 =====
    { name: '床（次卧）', type: '家具', room: '次卧', brand: '', model: '', length: 200, width: 150, height: 95, qty: 1, price: null, status: '待购', link: '', note: '1.5m×2m' },
    { name: '床垫（次卧）', type: '家具', room: '次卧', brand: '', model: '', length: 200, width: 150, height: 22, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '衣柜（次卧）', type: '家具', room: '次卧', brand: '', model: '', length: 150, width: 60, height: 240, qty: 1, price: null, status: '待购', link: '', note: '定制或成品' },
    { name: '书桌（次卧）', type: '家具', room: '次卧', brand: '', model: '', length: 120, width: 55, height: 75, qty: 1, price: null, status: '待购', link: '', note: '桌面深度≥55cm' },
    { name: '空调（次卧）', type: '大家电', room: '次卧', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '1.5匹挂机' },
    { name: '窗帘（次卧）', type: '软装', room: '次卧', brand: '', model: '', length: null, width: null, height: 270, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '儿童床', type: '家具', room: '儿童房', brand: '', model: '', length: 200, width: 120, height: 80, qty: 1, price: null, status: '待购', link: '', note: '1.2m×2m，可选上下铺' },
    { name: '儿童书桌', type: '家具', room: '儿童房', brand: '', model: '', length: 100, width: 55, height: 55, qty: 1, price: null, status: '待购', link: '', note: '可升降调节高度' },
    { name: '儿童衣柜', type: '家具', room: '儿童房', brand: '', model: '', length: 100, width: 55, height: 200, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '玩具收纳柜', type: '家具', room: '儿童房', brand: '', model: '', length: 80, width: 35, height: 80, qty: 1, price: null, status: '待购', link: '', note: '多层抽屉/收纳盒' },

    // ===== 厨房 =====
    { name: '冰箱', type: '大家电', room: '厨房', brand: '', model: '', length: 83, width: 65, height: 190, qty: 1, price: null, status: '待购', link: '', note: '十字对开/法式多门，注意散热预留' },
    { name: '烟机灶具套装', type: '大家电', room: '厨房', brand: '', model: '', length: 90, width: 52, height: null, qty: 1, price: null, status: '待购', link: '', note: '顶吸/侧吸，灶具开孔尺寸提前确认' },
    { name: '洗碗机', type: '大家电', room: '厨房', brand: '', model: '', length: 60, width: 60, height: 85, qty: 1, price: null, status: '待购', link: '', note: '嵌入式13套/16套，预留进排水' },
    { name: '蒸烤箱', type: '大家电', room: '厨房', brand: '', model: '', length: 60, width: 55, height: 45, qty: 1, price: null, status: '待购', link: '', note: '嵌入式，需16A插座' },
    { name: '微波炉', type: '小家电', room: '厨房', brand: '', model: '', length: 49, width: 39, height: 30, qty: 1, price: null, status: '待购', link: '', note: '可嵌入吊柜或台面放置' },
    { name: '电饭煲', type: '小家电', room: '厨房', brand: '', model: '', length: 25, width: 25, height: 22, qty: 1, price: null, status: '待购', link: '', note: 'IH电磁加热，3-5L' },
    { name: '净水器', type: '小家电', room: '厨房', brand: '', model: '', length: 40, width: 15, height: 40, qty: 1, price: null, status: '待购', link: '', note: 'RO反渗透，台下式需预留空间+插座' },
    { name: '垃圾处理器', type: '小家电', room: '厨房', brand: '', model: '', length: null, width: null, height: 35, qty: 1, price: null, status: '待购', link: '', note: '台下安装，需预留插座' },
    { name: '热水器/小厨宝', type: '大家电', room: '厨房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '燃气16L/电热，决定是否装循环泵' },
    { name: '橱柜（地柜）', type: '家具', room: '厨房', brand: '', model: '', length: null, width: 60, height: 85, qty: 1, price: null, status: '待购', link: '', note: '按延米定制，深度60cm标准' },
    { name: '橱柜（吊柜）', type: '家具', room: '厨房', brand: '', model: '', length: null, width: 35, height: 70, qty: 1, price: null, status: '待购', link: '', note: '深度35cm，距地柜台面60-70cm' },
    { name: '水槽+龙头', type: '五金配件', room: '厨房', brand: '', model: '', length: 75, width: 45, height: null, qty: 1, price: null, status: '待购', link: '', note: '大单槽或双槽，台下盆安装' },
    { name: '厨房吊顶灯', type: '灯具', room: '厨房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '集成吊顶平板灯，30×60cm或30×30cm' },
    { name: '空气炸锅', type: '小家电', room: '厨房', brand: '', model: '', length: 35, width: 28, height: 30, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '破壁机/豆浆机', type: '小家电', room: '厨房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '电热水壶', type: '小家电', room: '厨房', brand: '', model: '', length: 15, width: 15, height: 25, qty: 1, price: null, status: '待购', link: '', note: '' },

    // ===== 主卫 =====
    { name: '马桶（主卫）', type: '卫浴', room: '主卫', brand: '', model: '', length: 70, width: 40, height: 48, qty: 1, price: null, status: '待购', link: '', note: '智能马桶需预留电源+进水' },
    { name: '浴室柜+台盆', type: '卫浴', room: '主卫', brand: '', model: '', length: 80, width: 50, height: 85, qty: 1, price: null, status: '待购', link: '', note: '陶瓷一体盆/岩板，含镜柜' },
    { name: '镜柜', type: '卫浴', room: '主卫', brand: '', model: '', length: 70, width: 15, height: 70, qty: 1, price: null, status: '待购', link: '', note: '带除雾+LED照明功能' },
    { name: '花洒（主卫）', type: '卫浴', room: '主卫', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '恒温花洒，顶喷+手持' },
    { name: '浴霸/风暖', type: '小家电', room: '主卫', brand: '', model: '', length: 30, width: 30, height: null, qty: 1, price: null, status: '待购', link: '', note: '风暖式，集成吊顶嵌入式' },
    { name: '电热毛巾架', type: '小家电', room: '主卫', brand: '', model: '', length: 50, width: 10, height: 70, qty: 1, price: null, status: '待购', link: '', note: '需预留插座' },
    { name: '卫生间挂件套装', type: '五金配件', room: '主卫', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '毛巾杆/浴巾架/厕纸架/挂钩/置物架' },
    { name: '地漏（主卫）', type: '五金配件', room: '主卫', brand: '', model: '', length: 10, width: 10, height: null, qty: 2, price: null, status: '待购', link: '', note: '淋浴区+干区各一个，深水封防臭' },
    { name: '卫生间灯', type: '灯具', room: '主卫', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '防水防雾，集成吊顶平板灯' },

    // ===== 次卫 =====
    { name: '马桶（次卫）', type: '卫浴', room: '次卫', brand: '', model: '', length: 70, width: 40, height: 48, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '浴室柜+台盆（次卫）', type: '卫浴', room: '次卫', brand: '', model: '', length: 60, width: 50, height: 85, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '花洒（次卫）', type: '卫浴', room: '次卫', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '浴霸/风暖（次卫）', type: '小家电', room: '次卫', brand: '', model: '', length: 30, width: 30, height: null, qty: 1, price: null, status: '待购', link: '', note: '' },
    { name: '洗衣机', type: '大家电', room: '次卫', brand: '', model: '', length: 60, width: 60, height: 85, qty: 1, price: null, status: '待购', link: '', note: '10kg滚筒，预留进排水+插座' },
    { name: '烘干机', type: '大家电', room: '次卫', brand: '', model: '', length: 60, width: 60, height: 85, qty: 1, price: null, status: '待购', link: '', note: '热泵式，与洗衣机叠放或并排' },
    { name: '地漏（次卫）', type: '五金配件', room: '次卫', brand: '', model: '', length: 10, width: 10, height: null, qty: 2, price: null, status: '待购', link: '', note: '' },

    // ===== 阳台 =====
    { name: '电动晾衣架', type: '小家电', room: '阳台', brand: '', model: '', length: 120, width: 40, height: null, qty: 1, price: null, status: '待购', link: '', note: '带照明+风干+烘干功能' },
    { name: '阳台储物柜', type: '家具', room: '阳台', brand: '', model: '', length: 100, width: 40, height: 240, qty: 1, price: null, status: '待购', link: '', note: '收纳清洁工具/洗涤用品' },
    { name: '拖把池/洗衣池', type: '卫浴', room: '阳台', brand: '', model: '', length: 50, width: 45, height: 85, qty: 1, price: null, status: '待购', link: '', note: '陶瓷/不锈钢，含龙头' },
    { name: '阳台灯', type: '灯具', room: '阳台', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '防水吸顶灯' },

    // ===== 书房 =====
    { name: '书桌（书房）', type: '家具', room: '书房', brand: '', model: '', length: 140, width: 60, height: 75, qty: 1, price: null, status: '待购', link: '', note: '双人位可更长，深度60cm舒适' },
    { name: '人体工学椅', type: '家具', room: '书房', brand: '', model: '', length: 65, width: 65, height: 120, qty: 1, price: null, status: '待购', link: '', note: '腰部支撑+可调节扶手+头枕' },
    { name: '书柜', type: '家具', room: '书房', brand: '', model: '', length: 120, width: 35, height: 200, qty: 1, price: null, status: '待购', link: '', note: '开放式+封闭式结合' },
    { name: '电脑/显示器', type: '小家电', room: '书房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '27寸4K显示器' },
    { name: '打印机', type: '小家电', room: '书房', brand: '', model: '', length: 40, width: 35, height: 20, qty: 1, price: null, status: '待购', link: '', note: '激光/喷墨，需网口或WiFi' },
    { name: '书房主灯', type: '灯具', room: '书房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '4000K自然光，护眼' },
    { name: '台灯', type: '灯具', room: '书房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '国AA级护眼台灯' },
    { name: '空调（书房）', type: '大家电', room: '书房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '1匹/1.5匹挂机' },

    // ===== 玄关 =====
    { name: '鞋柜', type: '家具', room: '玄关', brand: '', model: '', length: 100, width: 35, height: 100, qty: 1, price: null, status: '待购', link: '', note: '底部留空15cm放常用鞋' },
    { name: '换鞋凳', type: '家具', room: '玄关', brand: '', model: '', length: 60, width: 30, height: 42, qty: 1, price: null, status: '待购', link: '', note: '可兼收纳' },
    { name: '玄关挂衣钩', type: '五金配件', room: '玄关', brand: '', model: '', length: 50, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '距地面170cm' },
    { name: '玄关灯', type: '灯具', room: '玄关', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '感应灯或筒灯' },
    { name: '全身镜（玄关）', type: '家具', room: '玄关', brand: '', model: '', length: null, width: null, height: 160, qty: 1, price: null, status: '待购', link: '', note: '贴在墙上或柜门内侧' },
    { name: '智能门锁', type: '五金配件', room: '玄关', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '指纹+密码+NFC+人脸识别' },
    { name: '可视门铃/猫眼', type: '小家电', room: '玄关', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '电子猫眼/智能门铃' },

    // ===== 储物间/其他 =====
    { name: '储物架', type: '家具', room: '储物间', brand: '', model: '', length: 120, width: 40, height: 200, qty: 2, price: null, status: '待购', link: '', note: '金属置物架，承重好' },
    { name: '吸尘器', type: '小家电', room: '储物间', brand: '', model: '', length: 25, width: 25, height: 115, qty: 1, price: null, status: '待购', link: '', note: '无线手持，收纳架固定充电' },
    { name: '梯子/折叠梯', type: '其他', room: '储物间', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '家用三步梯' },
    { name: '工具箱', type: '其他', room: '储物间', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '基础维修工具套装' },

    // ===== 全屋通用 =====
    { name: '智能音箱', type: '小家电', room: '客厅', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '全屋语音控制中枢' },
    { name: '电动窗帘电机+轨道', type: '小家电', room: '客厅', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '需提前预留插座' },
    { name: '安防摄像头', type: '小家电', room: '客厅', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '室内/室外，需预留电源' },
    { name: '烟雾报警器', type: '小家电', room: '厨房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '厨房必备' },
    { name: '燃气报警器', type: '小家电', room: '厨房', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '距天花板30cm内安装' },
    { name: '弱电箱', type: '其他', room: '玄关', brand: '', model: '', length: 40, width: 30, height: null, qty: 1, price: null, status: '待购', link: '', note: '预留足够空间放光猫+交换机+电源' },
    { name: '配电箱/空气开关', type: '其他', room: '玄关', brand: '', model: '', length: null, width: null, height: null, qty: 1, price: null, status: '待购', link: '', note: '分路≥12路，含漏保' },
    { name: '全屋踢脚线', type: '软装', room: '其他', brand: '', model: '', length: null, width: null, height: 6, qty: 1, price: null, status: '待购', link: '', note: '按米计算，铝合金/实木/PVC' },
  ];

  function getItems() {
    let items = App.getStore(STORE_KEY);
    // 首次使用或数据异常，写入预设数据
    if (!items || !Array.isArray(items) || items.length === 0) {
      items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
      // 给每个条目生成唯一 ID
      items.forEach((item, i) => {
        if (!item.id) item.id = 'f' + i + '_' + Date.now().toString(36);
      });
      App.setStore(STORE_KEY, items);
      return items;
    }
    // 兼容旧数据：补上缺失的 id 和 status
    let needsSave = false;
    items.forEach((item, i) => {
      if (!item.id) { item.id = 'f' + i + '_' + Date.now().toString(36); needsSave = true; }
      if (item.status === undefined) { item.status = '待购'; needsSave = true; }
    });
    if (needsSave) App.setStore(STORE_KEY, items);
    return items;
  }

  function saveItems(items) {
    App.setStore(STORE_KEY, items);
  }

  // ========== Render ==========
  function render() {
    let items = getItems();
    const roomFilter = document.getElementById('furniture-room-filter')?.value || 'all';
    const typeFilter = document.getElementById('furniture-type-filter')?.value || 'all';
    const searchText = (document.getElementById('furniture-search')?.value || '').toLowerCase().trim();

    if (roomFilter !== 'all') items = items.filter(i => i.room === roomFilter);
    if (typeFilter !== 'all') items = items.filter(i => i.type === typeFilter);
    if (searchText) {
      items = items.filter(i =>
        i.name.toLowerCase().includes(searchText) ||
        (i.brand || '').toLowerCase().includes(searchText) ||
        (i.model || '').toLowerCase().includes(searchText)
      );
    }

    renderTable(items);
    renderSummary(items);
  }

  function renderTable(items) {
    const tbody = document.getElementById('furniture-tbody');
    if (!tbody) return; // tab 未激活时不渲染
    if (items.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="10">暂无物品记录，点击"添加物品"开始记录</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const dims = [item.length, item.width, item.height].filter(Boolean);
      const dimStr = dims.length > 0 ? dims.join(' × ') + ' cm' : '-';
      const status = item.status || '待购';
      const statusCls = { '待购': 'badge-pending', '已购': 'badge-ordered', '已到货': 'badge-arrived', '已安装': 'badge-installed' }[status] || 'badge-pending';
      return `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td><span style="background:var(--primary-light);color:var(--primary);padding:2px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;">${item.type}</span></td>
          <td>${item.room}</td>
          <td>${[item.brand, item.model].filter(Boolean).join(' / ') || '-'}</td>
          <td>${dimStr}</td>
          <td>${item.qty || 1}</td>
          <td class="amount-cell">${item.price ? App.formatMoney(item.price) : '-'}</td>
          <td><span class="badge ${statusCls}">${status}</span></td>
          <td>${item.note || '-'}</td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-xs btn-edit" data-action="edit-furniture" data-id="${item.id}">编辑</button>
              <button class="btn btn-xs btn-del" data-action="delete-furniture" data-id="${item.id}">删除</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderSummary(items) {
    const el = document.getElementById('furniture-summary');
    if (!el) return; // tab 未激活
    const totalPrice = items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
    const totalQty = items.reduce((s, i) => s + (i.qty || 1), 0);

    // 按房间统计
    const roomStats = {};
    items.forEach(i => {
      roomStats[i.room] = (roomStats[i.room] || 0) + 1;
    });

    let html = `<span>共 <strong>${items.length}</strong> 种物品 / <strong>${totalQty}</strong> 件</span>`;
    html += `<span>合计金额：<strong>${App.formatMoney(totalPrice)}</strong></span>`;
    if (Object.keys(roomStats).length > 0) {
      html += `<span>按房间：${Object.entries(roomStats).map(([r, c]) => `${r} ${c}件`).join(' · ')}</span>`;
    }
    el.innerHTML = html;
  }

  // ========== CRUD ==========
  function showForm(item = null) {
    const isEdit = !!item;
    const title = isEdit ? '编辑物品' : '添加物品';

    const bodyHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>名称 *</label>
          <input type="text" id="form-name" value="${item?.name || ''}" placeholder="如：双人沙发">
        </div>
        <div class="form-group">
          <label>类别</label>
          <select id="form-type">
            ${TYPES.map(t => `<option value="${t}" ${item?.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>房间</label>
          <select id="form-room">
            ${ROOMS.map(r => `<option value="${r}" ${item?.room === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>数量</label>
          <input type="number" id="form-qty" min="1" value="${item?.qty || 1}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>购买状态</label>
          <select id="form-status">
            <option value="待购" ${item?.status==='待购'||!item?.status?'selected':''}>待购</option>
            <option value="已购" ${item?.status==='已购'?'selected':''}>已购</option>
            <option value="已到货" ${item?.status==='已到货'?'selected':''}>已到货</option>
            <option value="已安装" ${item?.status==='已安装'?'selected':''}>已安装</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>品牌</label>
          <input type="text" id="form-brand" value="${item?.brand || ''}" placeholder="品牌名称">
        </div>
        <div class="form-group">
          <label>型号</label>
          <input type="text" id="form-model" value="${item?.model || ''}" placeholder="型号">
        </div>
      </div>
      <div class="form-group">
        <label>尺寸 (厘米)</label>
        <div class="form-row-3">
          <input type="number" id="form-length" step="0.1" min="0" value="${item?.length || ''}" placeholder="长">
          <input type="number" id="form-width" step="0.1" min="0" value="${item?.width || ''}" placeholder="宽">
          <input type="number" id="form-height" step="0.1" min="0" value="${item?.height || ''}" placeholder="高">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>价格 (元)</label>
          <input type="number" id="form-price" step="0.01" min="0" value="${item?.price || ''}" placeholder="0.00">
        </div>
        <div class="form-group">
          <label>购买链接</label>
          <input type="url" id="form-link" value="${item?.link || ''}" placeholder="https://...">
        </div>
      </div>
      <div class="form-group">
        <label>备注</label>
        <input type="text" id="form-note" value="${item?.note || ''}" placeholder="颜色、材质等...">
      </div>
    `;

    const footerHTML = `
      <button class="btn btn-outline" id="btn-form-cancel">取消</button>
      <button class="btn btn-primary" id="btn-form-save">${isEdit ? '保存修改' : '添加物品'}</button>
    `;

    App.showModal(title, bodyHTML, footerHTML);

    document.getElementById('btn-form-cancel').addEventListener('click', App.hideModal);
    document.getElementById('btn-form-save').addEventListener('click', () => {
      const name = document.getElementById('form-name').value.trim();
      if (!name) return App.showToast('请输入物品名称', 'error');

      const data = {
        id: item?.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
        name,
        type: document.getElementById('form-type').value,
        room: document.getElementById('form-room').value,
        status: document.getElementById('form-status').value,
        brand: document.getElementById('form-brand').value.trim(),
        model: document.getElementById('form-model').value.trim(),
        length: parseFloat(document.getElementById('form-length').value) || null,
        width: parseFloat(document.getElementById('form-width').value) || null,
        height: parseFloat(document.getElementById('form-height').value) || null,
        qty: parseInt(document.getElementById('form-qty').value) || 1,
        price: parseFloat(document.getElementById('form-price').value) || null,
        link: document.getElementById('form-link').value.trim(),
        note: document.getElementById('form-note').value.trim(),
      };

      const items = getItems();
      if (isEdit) {
        const idx = items.findIndex(i => i.id === item.id);
        if (idx >= 0) items[idx] = data;
      } else {
        items.push(data);
      }

      saveItems(items);
      App.hideModal();
      App.showToast(isEdit ? '物品已更新' : '物品已添加', 'success');
      render();
    });
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定要删除这个物品记录吗？');
    if (!ok) return;

    const items = getItems().filter(i => i.id !== id);
    saveItems(items);
    App.showToast('物品已删除', 'success');
    render();
  }

  // ========== Init ==========
  function init() {
    document.getElementById('btn-add-furniture').addEventListener('click', () => showForm());
    document.getElementById('furniture-room-filter').addEventListener('change', render);
    document.getElementById('furniture-type-filter').addEventListener('change', render);
    document.getElementById('furniture-status-filter').addEventListener('change', render);
    document.getElementById('furniture-search').addEventListener('input', render);

    // 待购清单按钮
    document.getElementById('btn-furniture-todo').addEventListener('click', () => {
      document.getElementById('furniture-status-filter').value = '待购';
      render();
    });

    document.getElementById('furniture-tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'edit-furniture') {
        const item = getItems().find(i => i.id === id);
        if (item) showForm(item);
      } else if (action === 'delete-furniture') {
        deleteItem(id);
      }
    });

    render();
  }

  return { init, render };
})();
