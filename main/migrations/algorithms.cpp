#include <iostream>
#include <algorithm>
#include <map>
#include <string>
#include <vector>
#include <sstream>
#include <iterator>
#include <tuple>
#include <ctime>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <random>
#include <numeric> 
using namespace std;

vector<string> charArrayToVector(const char **&charArray,const int &size)
{
    vector<string> stringVector;
    for (int i = 0; i < size; i++)
    {
        stringVector.push_back(charArray[i]);
    }
    return stringVector;
}


map<string, float> calculateFrequencies(const vector<string> &words)
{
    // Count the number of occurrences of each word
    map<string, int> counts;
    int max_count = accumulate(words.begin(), words.end(), 0, [&](int max_count, const string& word) {
        int count = ++counts[word];
        return max(max_count, count);
    });

    // Calculate the frequencies of each word
    map<string, float> frequencies;
    for (auto &word_count : counts)
    {
        frequencies[word_count.first] = 5 * ((float)word_count.second / max_count);
    }

    return frequencies;
}
bool compare(tuple<int, int, float, int, int> a, tuple<int, int, float, int, int> b)
{
    float formula_a = (1.0 + static_cast<float>(get<2>(a))) * ((static_cast<float>(get<1>(a)) + 1.0) / (sqrt(static_cast<float>(get<4>(a)) / 24) + 1.0)) * ((2.0 * static_cast<float>(get<3>(a)) + 1.0) / (sqrt(static_cast<float>(get<4>(a)) / 24) + 1.0));
    float formula_b = (1.0 + static_cast<float>(get<2>(b))) * ((static_cast<float>(get<1>(b)) + 1.0) / (sqrt(static_cast<float>(get<4>(b)) / 24) + 1.0)) * ((2.0 * static_cast<float>(get<3>(b)) + 1.0) / (sqrt(static_cast<float>(get<4>(b)) / 24) + 1.0));
    return formula_a > formula_b;
}

float calcRelv(const map<string, float> &relvScores,const string &word)
{
    vector<string> individualWords;

    // Loop over each string in the original vector

    // Use a stringstream to split the string into words
    stringstream ss(word);
    string temp;

    while (ss >> temp)
    {
        // Add each word to the new vector
        individualWords.push_back(temp);
    }
    float ret = 0;
    for (const string &curr : individualWords)
    {
        if (relvScores.find(curr) != relvScores.end())
        {
            ret += relvScores.at(curr);
        }
    }
    return ret;
}

void calcRelvScore(int *memeIds, int *likedCount, const char **topAndBottomText, int *commentCount, int *timesPosted, const char **likedText, int size)
{
    int now = time(0);
    vector<string> memeTexts = charArrayToVector(topAndBottomText, size);
    vector<string> likedMemeStrings = charArrayToVector(likedText, size);
    vector<string> individualWords;

    // Loop over each string in the original vector
    for (string word : likedMemeStrings)
    {
        // Use a stringstream to split the string into words
        stringstream ss(word);
        string temp;

        while (ss >> temp)
        {
            // Add each word to the new vector
            individualWords.push_back(temp);
        }
    }
    map<string, float> relvScores = calculateFrequencies(individualWords);

    vector<tuple<int, int, float, int, int>> memes;

    for (int i = 0; i < size; i++)
    {

        int timeN = (now - timesPosted[i]) / 3600;
        timeN = (timeN < 6) ? 6 : timeN;
        memes.push_back(make_tuple(memeIds[i], likedCount[i], calcRelv(relvScores, memeTexts[i]), commentCount[i], timeN));
    }
    sort(memes.begin(), memes.end(), compare);
    for (int i = 0; i < size; i++)
    {
        memeIds[i] = get<0>(memes[i]);
        likedCount[i] = get<1>(memes[i]);
        commentCount[i] = get<3>(memes[i]);
        timesPosted[i] = now - ((get<4>(memes[i])) * 3600);
    }
}

// int main()
// {
//     int now = time(0);
//     int *memeIDs = new int[400]{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400};
//     int *likedCount = new int[400]{10000,2282261,93242654,63961960,96399066,14846673,1871452,73849393,66859766,66855523,95919116,26134306,7371728,52545612,11875968,95169993,5016770,47724984,55796750,170056,84570665,52680960,15024231,34173844,64638246,50489903,66427737,85074798,57856454,3118660,56707857,3578642,17274376,98748960,37382800,71985102,2028896,91324777,99833867,56713229,8577289,9200721,88321174,29912844,18628317,72523507,30311731,2528980,30731568,58040593,34652675,94646725,50508812,18737693,1365158,78141554,88810049,99581565,90592780,53653312,21128000,36495578,35159808,70785002,4761630,95713687,5513137,55274389,39693973,92353254,58585213,6987066,91780742,76091654,55652442,27295441,22391150,67940660,36898549,31490513,51603042,26199695,99515565,81534568,61720481,87142694,72251876,71546565,819444,22308533,87500554,74880545,52868755,92201227,46916974,1599375,20304256,57987501,27767010,76497106,5906569,32691245,3796658,13382675,42117830,72715979,96368757,98352329,76590305,72915876,41925450,34927509,2171118,94257715,13404563,92125910,15660004,81932240,29196706,81204208,9576203,32224187,41728596,68188519,21763798,22021691,27221468,63894193,52277850,9094504,77396556,35313970,19258179,35103390,41029897,69930953,25221033,13958053,48454496,27670833,66554493,65243689,93016512,27627525,61462214,94134933,33352294,41102699,68862717,29157575,85816510,27118759,9497095,10993685,32023591,40295948,47129740,87527056,95444894,57045886,65913980,50460801,76045590,94736509,2252095,20662660,72349056,308659,67701670,63221060,73554762,5721265,68067654,23833209,8345387,55727434,28693583,38108302,32702857,79980997,40695476,6158834,31594807,11421859,38656300,80826883,62633758,44550563,61731394,47362140,37193495,28399691,89123039,30371455,60144678,23331447,75689712,92321166,13161272,21253532,91805592,61959615,10493519,57118421,49683914,53466815,83606015,64557959,55865282,4936078,39235337,55659133,16112945,85104367,22281184,23752644,77610961,85318200,62489980,19814130,50575012,47539300,58383393,87948535,15632498,84672041,40296559,81094852,86817187,32683512,32948089,65647238,5264563,68320447,3657938,30291498,72296633,30472022,69943008,58364454,85327277,17601237,53195895,8345552,71403013,21928273,62615309,54331271,22182149,35460257,71793075,20842455,28015451,91170453,42136770,97831310,64534017,23885013,69898867,56843860,55867593,2057012,54173949,22863627,39844183,95493869,45692414,24480591,8172140,96739524,61586818,27104079,51833458,92474064,46740999,44289376,70159599,7748295,19251670,24006805,15296712,43322738,90336677,95021534,49199093,2827498,97345152,50615376,11558511,2863863,99943186,70449865,89965247,30205043,16842199,40345495,84650340,60400651,25476907,69491539,22318227,24576901,16430690,87655727,64050338,70826623,33020274,18245415,41744840,62844418,92537558,77709952,494971,76285407,32222270,35537241,59996373,18520437,27750851,59341905,67753438,70147781,88642591,4926736,43157801,47589476,58203219,75561599,39621369,46801062,18488903,16103281,68251109,19800871,93530462,93490241,73158844,67878295,18361147,45925247,82767761,28381818,97166041,14792665,45069244,64621098,2681273,16905936,71913517,26701050,71725298,8091410,16394463,6773540,91343623,43372827,18914704,49161344,43888645,48571339,39735195,2476543,76271936,85809234,45583352,10525366,57705365,37351992,62238852,50315377,24415635,31959915,22560198,77264779,92386274,14413674,46077439,28360987,84023672,88440961,90164572,37960909,60138363,3109783,34646714,72139265,8289357,13421523,8468471,79701301,69327404,16136992,81712337,7746747,81419756,20991737,74423549,5820743,71526166,47491282};
//     const char **words = new const char *[400]
//     {"minecraft world","minecraft hello","minecraft programming","hello hello","world programming","hello world","world python","python programming","world hello","hello hello","hello hello","world hello","hello world","hello world","programming hello","programming python","python programming","world minecraft","hello programming","minecraft hello","world hello","hello hello","python hello","minecraft hello","hello hello","hello world","hello hello","python world","programming hello","world programming","programming hello","hello world","hello programming","world hello","hello python","hello hello","hello world","hello hello","world hello","hello programming","minecraft minecraft","programming world","python world","hello world","programming world","world hello","hello world","world programming","hello hello","hello hello","programming programming","hello hello","hello hello","world minecraft","world hello","world python","hello python","python hello","world hello","world programming","hello hello","hello world","hello world","hello hello","python hello","world world","hello programming","hello hello","world hello","python python","world programming","programming world","hello hello","programming programming","hello hello","hello programming","programming minecraft","world python","programming hello","hello programming","world python","world python","python hello","hello python","hello hello","hello programming","minecraft python","world programming","hello world","hello programming","programming hello","world python","world world","hello python","python world","python hello","programming world","hello python","world hello","hello world","hello minecraft","hello hello","python programming","hello python","world world","hello hello","world python","hello programming","hello programming","world hello","python programming","hello python","python hello","hello hello","minecraft world","hello world","world world","programming world","hello world","hello programming","hello hello","hello minecraft","python world","hello world","hello programming","hello programming","hello hello","python python","world minecraft","python world","hello hello","hello hello","python python","hello world","hello world","world hello","hello world","world python","world python","hello hello","world hello","hello python","hello world","hello world","world world","hello world","minecraft hello","world hello","hello hello","programming world","hello hello","python python","hello python","programming minecraft","hello python","world hello","hello hello","world world","programming hello","hello hello","hello hello","programming hello","hello python","programming world","world hello","python hello","minecraft world","hello hello","hello hello","hello hello","hello hello","programming hello","world hello","programming hello","minecraft python","programming hello","world hello","world hello","hello hello","programming world","hello python","hello hello","hello minecraft","minecraft world","hello world","hello hello","hello hello","hello hello","hello hello","world world","hello world","hello hello","world world","hello world","hello hello","hello world","programming minecraft","world world","programming hello","hello hello","python world","hello programming","world programming","programming hello","hello programming","hello hello","hello world","hello python","programming world","hello world","python hello","world hello","hello world","world hello","hello world","hello python","hello python","hello world","hello python","world hello","world world","hello hello","python python","hello hello","programming hello","world hello","programming world","python world","hello world","hello hello","programming hello","minecraft hello","hello python","world hello","world python","world python","hello hello","world world","hello programming","hello hello","programming hello","hello world","hello python","world hello","world hello","world hello","python world","hello world","world hello","programming programming","hello programming","hello programming","hello hello","world world","hello hello","hello hello","hello hello","hello hello","hello python","python hello","world world","python hello","hello hello","hello python","hello hello","programming hello","world python","hello hello","world python","hello minecraft","hello world","python hello","minecraft hello","hello hello","world programming","programming hello","hello world","hello hello","python hello","python programming","hello hello","programming hello","world hello","hello hello","hello world","python minecraft","hello programming","hello hello","python hello","minecraft hello","hello programming","world hello","programming world","programming python","python world","hello hello","world programming","world programming","programming world","programming hello","python minecraft","hello minecraft","world minecraft","hello python","programming world","world world","world hello","world hello","world hello","hello programming","hello world","programming hello","hello hello","world minecraft","world hello","python hello","hello programming","hello hello","python world","hello world","programming hello","python world","hello world","hello hello","hello minecraft","hello hello","programming python","hello hello","minecraft programming","minecraft hello","hello hello","programming hello","hello hello","world python","hello hello","hello hello","world world","hello python","hello hello","world python","world programming","hello programming","hello python","world python","world minecraft","programming python","world hello","hello programming","hello hello","world world","hello python","hello world","hello world","hello hello","world programming","hello minecraft","hello python","hello python","world world","python world","hello hello","hello hello","python python","python python","hello world","world world","hello hello","world programming","hello hello","hello hello","programming hello","python world","world world","python hello","hello python","hello minecraft","hello programming","world hello","world programming","hello world","python world","programming world","hello world","world world","hello python","world hello","hello hello","hello python","programming hello","hello programming","hello hello","minecraft minecraft","hello hello","hello minecraft","python minecraft","world world","world hello","hello world","world hello","world world"};

//     const char **words2 = new const char *[400]
//     { "dogs dogs","man dogs","dogs dogs","penis man","dogs dogs","man balls","dogs dogs","man man","dogs dogs","dogs dogs","dogs penis","man man","dogs man","penis dogs","dogs man","balls man","balls dogs","dogs dogs","dogs balls","dogs penis","minecraft man","penis balls","man penis","man balls","dogs dogs","dogs balls","man dogs","man dogs","dogs balls","minecraft dogs","dogs balls","dogs dogs","penis balls","penis man","dogs dogs","balls minecraft","man man","dogs dogs","dogs dogs","balls balls","dogs dogs","dogs dogs","man dogs","dogs balls","penis minecraft","man dogs","dogs dogs","dogs dogs","balls man","man balls","man dogs","minecraft man","dogs man","balls dogs","dogs man","balls penis","man man","dogs man","dogs dogs","penis dogs","dogs balls","balls dogs","minecraft penis","penis dogs","balls dogs","minecraft balls","penis dogs","dogs penis","dogs dogs","dogs man","dogs man","dogs dogs","man man","man penis","balls dogs","balls man","penis dogs","dogs balls","dogs penis","balls balls","balls man","dogs man","balls man","man dogs","dogs dogs","dogs dogs","dogs dogs","balls man","dogs dogs","balls man","man balls","dogs man","man dogs","dogs dogs","dogs dogs","dogs balls","penis dogs","dogs dogs","man man","dogs man","dogs man","dogs dogs","dogs penis","balls dogs","balls minecraft","dogs balls","dogs dogs","penis dogs","dogs dogs","balls man","balls minecraft","dogs dogs","penis dogs","balls man","penis dogs","man balls","penis dogs","dogs dogs","man man","dogs dogs","dogs man","balls dogs","man man","dogs dogs","man dogs","balls balls","balls balls","man man","dogs dogs","dogs dogs","man balls","man dogs","dogs man","man dogs","dogs balls","man dogs","minecraft balls","balls dogs","man dogs","penis man","man dogs","man dogs","penis dogs","dogs balls","minecraft dogs","dogs dogs","dogs man","dogs dogs","dogs dogs","man balls","balls balls","dogs balls","dogs man","dogs man","dogs dogs","dogs dogs","dogs dogs","dogs dogs","man dogs","balls dogs","balls dogs","dogs dogs","dogs dogs","man dogs","man balls","man dogs","dogs balls","man minecraft","man balls","balls dogs","man man","penis dogs","man dogs","man dogs","penis dogs","man penis","penis dogs","dogs minecraft","dogs dogs","dogs man","dogs dogs","dogs penis","dogs man","dogs balls","dogs dogs","dogs man","dogs man","balls dogs","dogs dogs","man dogs","man minecraft","dogs man","dogs dogs","dogs dogs","dogs dogs","dogs dogs","dogs man","man minecraft","balls dogs","man penis","penis dogs","dogs penis","minecraft balls","man man","dogs minecraft","balls penis","man dogs","dogs dogs","man dogs","dogs dogs","penis dogs","balls balls","man dogs","balls balls","dogs dogs","penis balls","balls man","minecraft balls","balls dogs","balls man","balls dogs","dogs dogs","dogs man","dogs man","balls dogs","dogs balls","dogs balls","dogs dogs","penis penis","penis man","minecraft dogs","dogs dogs","dogs man","penis dogs","dogs penis","dogs penis","dogs dogs","dogs penis","dogs balls","man dogs","dogs dogs","dogs man","balls man","dogs man","dogs balls","dogs man","man man","minecraft dogs","man dogs","minecraft man","dogs dogs","dogs penis","dogs dogs","man dogs","dogs man","man minecraft","dogs man","balls man","man man","dogs minecraft","dogs balls","man balls","man minecraft","dogs dogs","balls dogs","dogs balls","dogs balls","man man","dogs penis","man dogs","dogs man","dogs dogs","dogs man","man dogs","dogs balls","dogs balls","dogs man","dogs dogs","penis minecraft","penis dogs","man dogs","man dogs","balls penis","balls man","man man","balls penis","balls dogs","man dogs","dogs man","minecraft dogs","minecraft dogs","man man","dogs man","dogs dogs","dogs minecraft","dogs dogs","dogs dogs","dogs man","penis dogs","man dogs","dogs dogs","balls penis","man dogs","dogs penis","dogs dogs","dogs balls","penis dogs","dogs dogs","man dogs","dogs balls","balls man","dogs dogs","man balls","balls dogs","balls dogs","dogs dogs","dogs dogs","man dogs","balls man","man penis","dogs dogs","balls balls","penis balls","dogs dogs","dogs man","dogs dogs","dogs dogs","minecraft dogs","penis dogs","dogs man","dogs dogs","dogs dogs","dogs dogs","dogs penis","man man","man dogs","dogs dogs","minecraft balls","balls balls","balls penis","dogs dogs","dogs balls","dogs dogs","balls dogs","man balls","dogs dogs","man dogs","penis dogs","dogs dogs","penis dogs","man minecraft","dogs penis","dogs dogs","dogs balls","man dogs","dogs dogs","penis balls","balls dogs","penis dogs","dogs dogs","man man","dogs dogs","balls dogs","dogs dogs","dogs dogs","balls man","dogs man","balls penis","dogs man","minecraft dogs","man dogs","dogs man","man man","dogs dogs","dogs man","man dogs","balls minecraft","dogs dogs","balls penis","man dogs","penis dogs","man man","dogs dogs","dogs man","man dogs","penis dogs","man dogs","dogs dogs","man man","man balls","dogs dogs","man man","dogs dogs","dogs dogs","man dogs","dogs minecraft","minecraft penis","man dogs","man balls","dogs minecraft"};

//     int *commentCount = new int[400]{50000000, 7770520,829291,8629093,6531026,9761971,8050027,1866212,6334218,8457404,775092,5378384,4016853,5372764,9225000,8491740,6472767,1849723,8659447,6258657,5257116,7245986,3873786,2701676,3843846,9001139,67104,9176707,5965841,2901074,7960702,3294926,6554088,3780825,726188,3116905,6423895,1028598,8965118,7485788,2168959,5206185,351087,359406,2195959,7602710,5826455,8881564,9793356,291395,2134687,6316464,3823273,4930909,75976,5332865,6401373,9845376,1291055,4229097,1051619,617210,6589362,2332929,2770644,4776332,8748461,9493188,7127042,4754939,2709263,2382580,4635600,4033125,2431126,5027925,1178418,1495413,4595547,9831684,1850902,2243375,4656580,6015391,925921,9563234,840504,8519687,3110141,8490518,4941589,4837656,7413144,3026646,4845950,6261615,7826114,8401253,3862256,7805806,7707359,7322640,3770813,79935,7448408,998659,7537570,4075642,6706419,2715799,1205127,4617170,8900106,3698607,6257634,3266420,2935435,1706250,7399935,4046090,6653044,4883495,7747332,2912858,9888487,6128628,9187039,9024690,2579491,408409,1450081,2780328,7152836,7646140,7960927,3719268,1671490,4633627,9572460,9475869,6669715,6844515,9620548,8054245,6679640,1509620,9433574,8425600,77636,9768596,3916886,9816425,8327625,9688745,7030399,9258928,8149162,297610,3011925,814999,560640,6256337,8556083,6016578,4385068,2461000,112373,7835588,8598301,5476734,7648538,5537914,4603707,8768212,2238427,383409,9795169,4504995,7314170,9785806,5202973,1778602,4876492,8345247,1656198,3022154,8877965,4281920,3915792,1103167,4581524,1557385,7687855,317341,2315532,4413205,6618053,9172639,1231539,2441845,3124900,4010163,8174810,3898537,4702157,268604,5236832,4884716,3033197,361009,8552986,4503836,575988,929426,409970,5194238,5958485,3772897,207899,7473162,2733696,3442575,3100232,130197,4879516,550200,8210121,2884946,5790117,7443080,2242278,7523832,8212687,6764496,4808111,284502,5656333,986207,4654985,4775143,7233998,2387929,8740874,7406031,900910,4942847,8565570,3021507,4102215,7457579,5638412,267044,685250,421161,4188699,4401071,141240,8910697,7061550,8357254,3509159,3318889,3979991,3862908,5418758,5574204,1037389,7785414,4021487,9818134,2440803,757345,3424594,225210,3159142,5190929,132006,95135,9754187,5421419,8672493,6849653,2568851,5769849,618487,6882162,879176,6171728,7924412,8747310,419550,4648795,2579317,407624,6580040,490391,3149249,2318290,8548939,575818,253787,6781705,5046214,8174074,5989435,8954934,5915561,5899825,1671415,2118604,4315683,8947261,7964533,7206510,1356747,2957237,4071097,3464800,8234916,7212043,3064777,4741528,7870041,3025370,8436649,7830719,6676190,1094037,4181831,1405734,6233531,8829981,9450769,6173895,8101669,8838355,9030964,2052056,7000152,9466010,7405225,834123,1260996,2230502,5874626,5184997,646820,2417203,5900044,480698,4560772,6006716,9011405,88045,4603691,590820,5528402,2656145,3393464,8043147,5211198,4807250,7488023,4520985,8091705,3588559,8789550,1114364,9490816,8553318,5790043,8463558,6661376,3526530,1214130,8263904,457707,6640953,5355886,726876,186552,8551332,5269084,4269733,971073,529863,1919443,5560391,5352067,1205086,60325,4163872,7317465,1263269,9190742,6416558,5734151,5473968,8739040,3907340};
//     int *timesPosted = new int[400]{now - 1000000,now-1631060677,now-1640273528,now-1540605982,now-1645295092,now-1581801895,now-1608817299,now-1494338082,now-1583862403,now-1568813762,now-1552642317,now-1653349199,now-1638314367,now-1644515327,now-1553500692,now-1601611802,now-1676076047,now-1604442494,now-1666946174,now-1664938511,now-1487852240,now-1590057906,now-1675396673,now-1487732874,now-1600455302,now-1553721976,now-1543293125,now-1537392378,now-1589705608,now-1589116840,now-1675519861,now-1518489711,now-1523924476,now-1493021274,now-1609150822,now-1489583464,now-1624761446,now-1580148441,now-1522019639,now-1625445600,now-1505677127,now-1600355611,now-1522334005,now-1627975819,now-1590213429,now-1672349961,now-1607836610,now-1669133426,now-1511670026,now-1638904174,now-1589911166,now-1588745563,now-1619199217,now-1586855583,now-1514952722,now-1511332796,now-1564478837,now-1607723678,now-1524808171,now-1487692755,now-1483185508,now-1528965440,now-1485243295,now-1601986526,now-1630712639,now-1594220959,now-1601498139,now-1489208786,now-1631678671,now-1584103938,now-1624927488,now-1615727931,now-1631756742,now-1530094179,now-1579915348,now-1612103291,now-1599845307,now-1577621710,now-1619619340,now-1537470915,now-1665078343,now-1536809090,now-1641473459,now-1668874281,now-1537862358,now-1630413819,now-1583653734,now-1511490689,now-1658397121,now-1562129143,now-1533065145,now-1674869426,now-1505627727,now-1663407823,now-1649114204,now-1508472027,now-1539876181,now-1524633050,now-1654935551,now-1683082923,now-1598521579,now-1519485276,now-1523619638,now-1494740904,now-1589921609,now-1578692140,now-1559968053,now-1592486771,now-1565177798,now-1619286210,now-1634194085,now-1639438664,now-1581411259,now-1617206858,now-1487494433,now-1614001883,now-1484095932,now-1581885783,now-1506646513,now-1569649389,now-1651435527,now-1536100469,now-1652220202,now-1489877130,now-1506982482,now-1528876540,now-1621863495,now-1569056246,now-1497018795,now-1495490441,now-1517354266,now-1583309668,now-1554484168,now-1505939643,now-1492259641,now-1522017400,now-1502763153,now-1557108863,now-1611928655,now-1583576884,now-1638841016,now-1598552776,now-1596678599,now-1601446636,now-1550333935,now-1497127677,now-1583635885,now-1595495658,now-1490815145,now-1593304839,now-1500450783,now-1650759038,now-1578612929,now-1523606030,now-1488897035,now-1484193885,now-1630543963,now-1548300605,now-1542817142,now-1538735299,now-1580687327,now-1543814920,now-1528283019,now-1572520532,now-1536157485,now-1597250946,now-1630391021,now-1510575846,now-1598958824,now-1600640241,now-1672236697,now-1627019723,now-1550177147,now-1531887703,now-1604198131,now-1668189977,now-1488179976,now-1603296589,now-1583711156,now-1494471332,now-1653715219,now-1616186110,now-1485271979,now-1491187616,now-1680582785,now-1646199434,now-1642331211,now-1606289670,now-1522246747,now-1606949715,now-1513421824,now-1682936955,now-1604773170,now-1618419885,now-1624554919,now-1594828370,now-1484168090,now-1592106375,now-1497929545,now-1617139499,now-1649952672,now-1497209781,now-1636681292,now-1514741353,now-1655125346,now-1597777147,now-1548342981,now-1649820102,now-1650308517,now-1560647271,now-1485440661,now-1673334694,now-1494081596,now-1542915882,now-1583879734,now-1502379557,now-1649116140,now-1540925901,now-1567220110,now-1613322882,now-1532433430,now-1514087558,now-1503650309,now-1512433094,now-1555092412,now-1545934541,now-1604774006,now-1555235607,now-1498407835,now-1681298786,now-1500334422,now-1657649681,now-1608098642,now-1549338216,now-1494799607,now-1539768964,now-1643507670,now-1524224738,now-1544531420,now-1607424640,now-1625059602,now-1654129174,now-1500518666,now-1511904184,now-1646834259,now-1649685736,now-1650065253,now-1600779260,now-1514995325,now-1656240463,now-1651373137,now-1510500790,now-1580445446,now-1488764497,now-1625812545,now-1523987895,now-1520479692,now-1630105160,now-1549427177,now-1600986589,now-1608216161,now-1494585168,now-1657904568,now-1507484349,now-1674314127,now-1668401577,now-1637811568,now-1633316150,now-1578786087,now-1665682387,now-1617415354,now-1508435995,now-1615611930,now-1488611809,now-1589925249,now-1515053198,now-1666605801,now-1534276169,now-1490275732,now-1621215237,now-1512541143,now-1510089773,now-1533397140,now-1527248487,now-1606761671,now-1624472536,now-1675017669,now-1659490577,now-1509738743,now-1504753228,now-1582015134,now-1510083054,now-1605626148,now-1628669145,now-1682267880,now-1657277201,now-1618303568,now-1562538987,now-1566501153,now-1521628563,now-1497998848,now-1496476897,now-1559724299,now-1637210200,now-1583768442,now-1536789980,now-1616332959,now-1553913087,now-1665794439,now-1622530605,now-1613666304,now-1569025215,now-1664754806,now-1502864262,now-1681124372,now-1505759521,now-1503843076,now-1581169993,now-1554776788,now-1622488941,now-1519429438,now-1557786618,now-1637500143,now-1670402015,now-1609679641,now-1637848766,now-1654742097,now-1627973865,now-1652475490,now-1565782803,now-1662666053,now-1497507296,now-1596519314,now-1569241370,now-1646268236,now-1617740109,now-1553323946,now-1573424541,now-1571565124,now-1497422596,now-1504365565,now-1518770916,now-1524100695,now-1675372602,now-1582759697,now-1569181035,now-1658490158,now-1593003715,now-1505042813,now-1519036465,now-1639923121,now-1610211656,now-1525922799,now-1592032566,now-1562856400,now-1496566849,now-1625556317,now-1569914793,now-1514517854,now-1484068886,now-1676577290,now-1676616682,now-1581785634,now-1617875913,now-1514091792,now-1564325825,now-1639407158,now-1601199124,now-1551799910,now-1547115968,now-1510835929,now-1494297729,now-1639692200,now-1520727132,now-1620658099,now-1573828244,now-1615036515,now-1490996178,now-1659477078,now-1491775788,now-1549304855,now-1494438726,now-1521701127,now-1549842035,now-1536044333,now-1516546366,now-1596909493,now-1616887552,now-1658375039,now-1491960214,now-1497606582,now-1492550594,now-1486967124,now-1621250810,now-1563896863,now-1672819428,now-1679941889,now-1665628418,now-1662436369,now-1559112367};

//     for (int i = 0; i < 40; i++)
//     {
//         cout << memeIDs[i] << " " << words[memeIDs[i] - 1] << "\n";
//     }
//     cout << endl;
//     calcRelvScore(memeIDs, likedCount, words, commentCount, timesPosted, words2, 400);
//     for (int i = 0; i < 40; i++)
//     {
//         cout << memeIDs[i] << " " << words[memeIDs[i] - 1] << "\n";
//     }
//     cout << endl;
//     // Free dynamically allocated memory
//     delete[] memeIDs;
//     delete[] likedCount;
//     for (int i = 0; i < 400; i++)
//     {
//         delete[] words[i];
//         delete[] words2[i];
//     }
//     delete[] words;
//     delete[] words2;
//     delete[] commentCount;
//     delete[] timesPosted;
//     system("pause");
//     return 0;
// }
