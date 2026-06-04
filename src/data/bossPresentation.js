export const BOSS_PRESENTATION = {
  COMMANDER: {
    summary: '编队推进，靠护卫和阵线慢慢挤压场地。',
    threats: ['推进', '护卫', '正面压制'],
    counterplay: '优先打散前排护卫，给炮塔留出持续输出线。',
  },
  HUNTER: {
    summary: '高速试探后突然切入，逼你不停换位。',
    threats: ['追猎', '突进', '假动作'],
    counterplay: '别贪站桩，提前横向拉开，让高爆发塔吃满它的切入空档。',
  },
  FORTRESS: {
    summary: '正面推进的重装城塞，越拖越难拆。',
    threats: ['重甲', '冲城', '范围震荡'],
    counterplay: '先用长程和减速拖住它，再用范围火力清掉护送单位。',
  },
  PRISM: {
    summary: '折射火线会不断改角度，安全区会自己消失。',
    threats: ['折射', '镜像', '交叉线'],
    counterplay: '看到镜线先离开交点，再回头补输出，不要和塔位站成一条线。',
  },
  HIVE: {
    summary: '用巢体和孵群把战场经营成自己的地盘。',
    threats: ['产巢', '增殖', '回收再铺场'],
    counterplay: '优先清掉新生巢点和召唤物，别让它把场面滚起来。',
  },
  FROST_JUDGE: {
    summary: '先减速再点杀，拖延越久越像被判死刑。',
    threats: ['减速区', '冻结', '处刑点名'],
    counterplay: '留意冻结预兆，别把关键塔都堆在同一块区域。',
  },
  RAIL_WARLORD: {
    summary: '用锁线和狙杀把固定塔阵一点点拆开。',
    threats: ['锁线', '狙击', '压制网格'],
    counterplay: '看到准线先走位，关键塔尽量分散，不要给它一次穿两座。',
  },
  COLLECTOR: {
    summary: '一边偷资源一边逼你追着止损。',
    threats: ['偷钱', '催债', '骚扰搬运'],
    counterplay: '优先保住经济线，宁可少补塔，也别放任它连续抽税。',
  },
  TWINS: {
    summary: '双体交错封位，一明一暗地把走位切碎。',
    threats: ['双体联动', '交叉火线', '残存狂怒'],
    counterplay: '先识别日月分工，拆掉限制走位的一体，再处理暴走的另一体。',
  },
  DRAGON: {
    summary: '不断掠场改角度，把你从舒适站位里扇出来。',
    threats: ['扫场', '俯冲', '天火'],
    counterplay: '别守死一个点，顺着喷吐方向横切，躲开俯冲落点后再回输出圈。',
  },
  SPIDER_MATRIARCH: {
    summary: '蛛网和幼体会一层层叠起来，把退路织没。',
    threats: ['铺网', '孵潮', '包围'],
    counterplay: '先清网区和幼体刷新口，别在半封锁区域里恋战。',
  },
  ASTROLABE: {
    summary: '引力会让原本安全的路线突然变成陷阱。',
    threats: ['牵引', '轨道', '奇点'],
    counterplay: '提前预留转向空间，看到奇点蓄势就先脱离中心线。',
  },
  BLOOD_FORGE: {
    summary: '把场上的小怪熔成自己的护甲和爆发。',
    threats: ['献祭', '锻甲', '爆炉'],
    counterplay: '不要放任它带着小怪进二阶段，先拆随从再压本体。',
  },
  VOID_CONDUCTOR: {
    summary: '像节拍器一样连续压拍，逼你按它的节奏移动。',
    threats: ['节拍线', '切分', '终章爆发'],
    counterplay: '把连续预兆当节奏记，先躲下一拍的位置，再回来补塔阵。',
  },
  LABYRINTH_KEEPER: {
    summary: '不断造墙换门，把你的惯性走位变成死路。',
    threats: ['封路', '换门', '挤压'],
    counterplay: '别把自己卡进塔堆死角，始终给角色保留一条横向逃生线。',
  },
  NIGHTMARE_BLOOM: {
    summary: '污染会扩散、生根，再把整片区域拖成慢性死亡。',
    threats: ['播种', '扩散', '寄生花园'],
    counterplay: '及时离开染区边缘，优先清理能继续扩散的核心节点。',
  },
};

export const getBossPresentation = (bossId) => BOSS_PRESENTATION[bossId] ?? null;
