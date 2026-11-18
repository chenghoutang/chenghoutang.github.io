// Normalize the legacy question bank once, then maintain its explicit targets.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filename = path.join(root, 'Chinese_DATA.json');
const rows = JSON.parse(fs.readFileSync(filename, 'utf8'));
const toneMarks = { 'ă': 'ǎ', 'ĕ': 'ě', 'ĭ': 'ǐ', 'ŏ': 'ǒ', 'ŭ': 'ǔ' };
const normalize = value => value.normalize('NFC').replace(/[ăĕĭŏŭ]/g, mark => toneMarks[mark]);

// One-based starts of the original 1,036-entry groups. These identify the
// particular character each legacy single-syllable question was testing.
const legacyGroups = `
1:阿 6:腌 9:挨 13:艾 17:拗 22:扒 26:膀 31:蚌 34:磅 37:剥
42:薄 50:刨 55:曝 56:暴 57:曝 58:背 64:臂 67:奔 72:辟 78:裨
82:扁 84:便 88:骠 91:瘪 94:屏 98:泊 102:簸 104:参 109:孱 112:伧
114:差 124:禅 127:颤 130:场 136:绰 140:称 145:乘 147:澄 151:冲
156:臭 159:处 165:畜 168:揣 174:创 178:幢 181:椎 183:伺 186:攒
190:撮 194:逮 197:当 201:铛 204:叨 209:倒 215:提 219:度 224:囤
227:恶 232:发 236:坊 239:菲 242:分 246:否 249:脯 251:轧 256:干
261:杆 265:扛 268:胳 272:给 277:更 280:颈 283:供 289:勾 291:骨
295:呱 298:观 300:冠 305:行 311:吭 313:巷 316:喝 321:和 331:荷
336:横 341:哄 348:红 351:晃 353:混 359:豁 364:几 368:期 373:缉
376:稽 380:诘 383:亟 385:藉 389:济 396:夹 401:假 405:间 410:渐
414:槛 416:强 421:嚼 427:角 432:剿 435:校 441:解 447:禁 451:尽
456:靓 459:据 462:隽 466:龟 470:卡 477:空 483:溃 488:烙 491:勒
494:累 500:擂 502:俩 505:量 510:踉 512:燎 514:潦 517:溜 521:弄
525:绿 530:露 538:偻 541:捋 544:率 551:纶 554:落 562:抹 568:埋
571:脉 573:蔓 577:没 581:蒙 588:靡 592:模 597:缪 599:难 605:泥
609:粘 611:宁 615:拧 620:疟 622:呕 624:胖 626:炮 629:喷 633:漂
640:迫 644:仆 647:脯 650:蹊 652:跂 653:纤 657:倩 660:悄 665:翘
669:鞘 672:壳 678:切 683:曲 690:撒 695:塞 702:散 707:丧 710:刹
714:煞 718:裳 720:折 727:舍 732:省 737:拾 741:数 747:刷 750:似
755:忪 757:宿 762:遂 766:拓 770:沓 773:苔 776:帖 782:委 785:圩
788:系 794:吓 798:鲜 803:削 809:兴 813:旋 814:漩 815:旋 818:血 824:咽 830:殷
836:钥 838:掖 842:遗 846:饮 851:应 860:佣 864:晕 870:熨 873:扎
879:咋 882:载 888:着 900:挣 904:症 907:识 911:中 918:轴 923:琢 926:作
930:暧 931:谙 933:鏖 934:焙 935:贲 936:狸 937:髀 938:砭 939:飙
940:蹩 941:摈 944:擘 946:哺 948:埠 950:簿 951:糙 952:嘈 953:岑
954:侪 956:觇 957:谄 958:怅 960:掣 961:坼 963:嗔 965:抻 967:笞
968:踟 969:豉 970:褫 972:饬 974:炽 976:敕 977:憧 978:刍 980:怵
981:遄 982:淙 983:徂 984:簇 986:蹙 988:蹿 990:忖 992:痤 993:挫
994:骀 995:澹 996:档 998:邸 999:缔 1000:淀 1002:靛 1003:玷 1005:酊
1006:锭 1007:恫 1008:胴 1009:牍 1011:渎 1012:蠹 1013:掇 1014:樊
1015:梵 1016:蜚 1018:斐 1019:氛 1021:敷 1022:甫 1023:脯 1025:讣
1027:尴 1028:舸 1029:亘 1031:梗 1032:肱 1033:佝 1034:箍 1036:梏
`.trim().split(/\s+/).map(group => {
    const [start, target] = group.split(':');
    return { start: Number(start), target };
});

if (rows.some(row => !row.target)) {
    assert.equal(rows.length, 1036, 'Legacy group annotation requires the original row order.');
    let group = 0;
    for (let i = 0; i < rows.length; i++) {
        while (legacyGroups[group + 1]?.start <= i + 1) group++;
        rows[i].target = legacyGroups[group].target;
    }
}

const unique = new Map();
let normalizedFields = 0;
for (const row of rows) {
    const right = normalize(row.right);
    const wrong = [...new Set(row.wrong.map(normalize))];
    normalizedFields += Number(right !== row.right) + row.wrong.filter((p, i) => p !== normalize(p)).length;
    assert.equal([...row.target].length, 1, 'Each question must identify one character.');
    assert.ok(row.text.includes(row.target), `${row.text}: target ${row.target} is missing`);
    assert.ok(wrong.length && !wrong.includes(right), `${row.text}: a distractor equals the answer`);
    // Keep the capital initial used for the proper noun 蒙古包 consistent.
    const entry = { text: row.text, target: row.target, right, wrong };
    const key = JSON.stringify([entry.text, entry.target, entry.right]);
    const existing = unique.get(key);
    if (existing) existing.wrong = [...new Set([...existing.wrong, ...entry.wrong])];
    else unique.set(key, entry);
}
fs.writeFileSync(filename, JSON.stringify([...unique.values()], null, 2) + '\n');
console.log(`Chinese_DATA.json: ${unique.size} records; normalized ${normalizedFields} pronunciation fields; merged ${rows.length - unique.size} duplicates.`);
