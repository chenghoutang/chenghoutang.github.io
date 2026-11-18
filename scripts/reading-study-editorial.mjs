// Editorial main ideas are deliberately separate from the unmodified source texts.
export const mainIdeas = `
001|Individual skin conditions change how perfume molecules evaporate and how a fragrance smells.
002|Aboriginal astronomical knowledge explains celestial movements and their connections to life on Earth.
003|A compass works by aligning a magnetised needle with Earth's magnetic field.
004|An ancient Arabian lakeshore provides evidence of human life in a landscape once much greener than today.
005|An unusual pair of stars helps explain a repeating radio signal from a dead star.
006|Chemical evidence in ancient rocks helps scientists date the beginnings of plate tectonics.
007|Bacteria-infecting viruses may offer new ways to tackle antibiotic resistance.
008|Crystals inside volcanoes can preserve signals that help researchers understand approaching eruptions.
009|Whether AI agents have minds depends on difficult philosophical questions about thought and agency.
010|New Zealand's distinctive natural history makes a case for a museum devoted to evolution and geology.
011|Learning from finished expressions of thought is different from learning the process of thinking.
012|Geological research investigates the enormous stretches of time missing from Earth's rock record.
013|Safety practices in hazardous industries offer lessons for regulating artificial intelligence.
014|Ancient crane DNA challenges assumptions about species extinction and classification.
015|A new CERN experiment could deepen understanding of the electron and fundamental physics.
016|Scientists are developing ways to select valuable soil samples from the Martian moon Phobos.
017|AI could change mathematical research while leaving an essential role for human judgement.
018|Ancient DNA offers new evidence about the origins and spread of Germanic and Celtic languages.
019|Evidence suggests prehistoric northern European hunters may have used poisoned arrows.
020|Antarctic microorganisms reveal a rich but often overlooked dimension of biodiversity.
021|Routine water-quality reports cover only part of what matters for understanding drinking water.
022|Oceans and forests have slowed warming by absorbing carbon, but their future capacity is uncertain.
023|Dry climates can increase river nitrate pollution even far from intensive human activity.
024|Effective early warnings can help communities prepare for the health threats associated with El Niño.
025|Wildfire damage is likely to increase, but affordable protective measures can reduce future losses.
026|Human development creates opportunities for mosquitoes and the diseases they transmit.
027|A long-standing vision of energy efficiency offers a useful perspective on modern electrification.
028|Past El Niño erosion shows why California's vulnerable coastline remains at risk.
029|Condor conservation illustrates the importance of deciding whose voices shape species protection.
030|New tracking technologies are changing knowledge of bird migration and opportunities for conservation.
031|Periods without wind or sunshine create challenges for electricity systems that depend on renewables.
032|Comparing Scotland and Wales reveals policy choices that influence recycling performance.
033|Both artificial and natural wetlands can provide important habitat for young turtles.
034|The sinking of a large ship creates an artificial reef that marine organisms will gradually colonise.
035|Studying starling murmurations may reveal how spectacular flocking displays change as bird numbers fall.
036|Research documents an increase in foggy days in southern Australia and explores its causes.
037|Rocky habitats support many reptile species but are often overlooked in conservation.
038|Natural ecosystems can provide climate adaptation at lower cost than many engineered structures.
039|Predicting some El Niño events further ahead could improve preparation for their consequences.
040|Humidity increases the danger of heatwaves and deserves greater attention in public warnings.
041|Body weight reflects interacting biological, social and environmental influences.
042|New research explores a way to repair heart tissue damaged by a heart attack.
043|Blood changes may provide clues to very early processes associated with ovarian cancer.
044|Research compares heat and cold as approaches to recovery after exercise.
045|Managing blood sugar requires understanding which strategies actually reduce glucose spikes.
046|Early biological mechanisms help babies distinguish between day and night.
047|The history of the food pyramid shows how nutrition advice and its presentation have changed.
048|Evidence about fluoride helps explain the differences between natural and conventional toothpaste.
049|Claims about stair-climbing machines need to be assessed against evidence on fitness and bone health.
050|The location and function of body fat help explain why fat is stored around the buttocks.
051|Food-based healthcare approaches have a long history and are attracting renewed interest.
052|Biomarkers help measure health, and new research methods can help discover additional markers.
053|Mammograms may reveal information about cardiovascular health as well as breast cancer.
054|The physical properties of foods explain why freezing and thawing affect their textures differently.
055|Prescribing time in nature raises questions about the evidence for health benefits.
056|Regular park visits are associated with measurable differences in children's mental health.
057|Private schooling can reinforce class separation and wider social divisions.
058|Minority language speakers continue to face prejudice in different European settings.
059|Public libraries support communities in many ways and need resources to sustain that work.
060|Better preparation for teachers is central to supporting pupils with dyslexia.
061|Science curricula often overlook women whose work helped shape scientific knowledge.
062|Adults' responses to risk and mess can limit the benefits children gain from outdoor play.
063|Online communities can be valuable spaces for autistic young people.
064|Making documentaries with scientists can strengthen students' scientific belonging and public trust.
065|School recess supports children's development in ways that extend beyond entertainment.
066|Schools can reduce some learning gaps while advantages linked to family wealth persist.
067|A long-term study links public prekindergarten attendance to better later educational outcomes.
068|Time spent with friends in person is strongly associated with flourishing among college students.
069|A heavy burden of standardised testing does not necessarily lead to better learning.
070|Reducing classroom technology changes school routines and raises questions about digital learning.
071|Objects found at a medieval Irish fort reveal details of daily life and material culture.
072|Tove Jansson's Hobbit illustrations express an imaginative understanding of childhood.
073|The discovery of a Roman fort revives interest in an emperor's place in Welsh tradition.
074|Ancient disputes over mapmaking illuminate debates about how the world is represented.
075|A public poetry project connects Shakespeare's influence with everyday journeys on the Underground.
076|An early bestseller offers a historical parallel to modern concerns about low-quality popular content.
077|Shackleton transformed Antarctic disappointment into a source of public fame.
078|Denmark's reputation for open-mindedness has a more complicated history than stereotypes suggest.
079|A Chinese poet's writing about cats offers an early exploration of their imagined inner lives.
080|Achieving a goal can produce emptiness, revealing limits of achievement as a source of fulfilment.
081|Working with other people can produce more creative and meaningful ideas than relying on AI alone.
082|Horror filmmakers exploit features of human vision to create frightening effects.
083|Two early computer games helped establish the first-person shooter genre.
084|Foley artists create carefully performed sound effects that play an essential role in cinema.
085|Preserving floppy-disk contents requires overcoming problems of obsolete hardware and digital access.
086|Climate-related risks discourage investment in poorer countries and can also harm corporations.
087|Fireworks create environmental and economic costs that outlast the celebrations.
088|Anticipating problems at work can create stress even before those problems occur.
089|Resilience beyond short household emergencies depends on stronger food supply chains.
090|Research on office attendance offers a more nuanced view of how often people should work on site.
091|Victorian spiritualism turned the desire to communicate beyond death into commercial opportunities.
092|Psychological biases can lead investors to make poor financial decisions.
093|Aquaculture can contribute to food security while reducing pressure on valuable wild fish resources.
094|The closure of a large retailer can change the fortunes of surrounding businesses.
095|Customers' perceptions of corporate generosity depend on donation frequency as well as total value.
096|Shopping early can provide practical benefits for both consumers and retailers.
097|State responses to childcare funding cuts offer lessons for future policy.
098|Data-centre development is associated with modest local employment growth rather than a jobs boom.
099|Consumers' ideas about organic food do not always match what labels and standards communicate.
100|Long-term evidence shows how childhood poverty can continue to shape economic disadvantage in adulthood.
`.trim().split('\n').map(line => {
    const [folder, mainIdea] = line.split('|');
    return { folder, mainIdea };
});

// Supplement the dictionary with domain-specific collocations and contextual senses.
export const phraseGlossary = `
small moments of respite|短暂的喘息时刻|brief opportunities for rest or relief
skin chemistry|皮肤的化学特性|the chemical conditions of an individual's skin
paper strip|试香纸条；纸条|a narrow piece of paper
according to|根据；据……所说|as stated or reported by a source
for example|例如|used to introduce an illustration of a point
such as|例如；诸如|used to introduce examples
in fact|事实上|used to emphasise what is actually true
as if|仿佛；好像|in a way that suggests something is the case
as though|仿佛；好像|in a way that suggests something is the case
instead of|代替；而不是|in place of something else
in spite of|尽管|despite something
in theory|理论上|according to an idea or principle rather than necessarily in practice
at least|至少|not less than a stated amount
on record|有记录以来|among documented observations
in the wake of|在……之后；作为……的后果|following something and often as a consequence of it
at the heart of|处于……核心|at the central or most important part of something
come a long way|取得很大进步|to make considerable progress
far more than|远远多于|to a substantially greater extent than
in tow|紧随其后|following or accompanying someone or something
on board|在船上；在交通工具上|aboard a ship or other vehicle
subjected to|遭受；受到|made to experience something, often unpleasant
capacity for empathy|共情能力|the ability to understand and share others' feelings
commercial opportunities|商业机会|possibilities for earning money through business
commercial exploitation|商业开发；商业利用|using something to make money
hidden costs|隐性成本|costs that are not immediately obvious
negative externality|负外部性|a cost imposed on people outside a transaction
working from home|居家办公|doing one's paid work at home
motion pictures|电影|films as an art form or medium
cultural heritage|文化遗产|cultural resources inherited from the past
floppy disks|软盘|older removable magnetic storage media
periodic table|元素周期表|a table organising the chemical elements
science education|科学教育|teaching and learning about science
word reading|词汇认读|recognising and decoding written words
spoken and written language|口语和书面语|language expressed through speech and writing
academic achievement|学业成就|educational performance and attainment
school districts|学区|local administrative areas responsible for schools
literary allusions|文学典故|indirect references to literary works or traditions
global editions|世界各地的版本|versions published in different parts of the world
Roman emperor|古罗马皇帝|an emperor of the Roman state
archaeological discovery|考古发现|a finding made through the study of material remains
Mercator projection|墨卡托投影|a map projection useful for navigation but distorting relative area
London Underground|伦敦地铁|London's underground railway system
polar explorers|极地探险家|people who explore polar regions
night shifts|夜班|work periods taking place during the night
blood samples|血液样本|samples of blood collected for testing
fallopian tube|输卵管|a tube carrying eggs from an ovary towards the womb
coastal wetlands|滨海湿地|wetland ecosystems near the coast
satellite tags|卫星追踪标签|devices that transmit tracking information through satellites
freshwater lake|淡水湖|a lake containing water with little dissolved salt
hunting weapons|狩猎武器|weapons used to hunt animals
mathematical questions|数学问题|questions that require mathematical investigation
mathematical knowledge|数学知识|knowledge of mathematical concepts and results
ocean currents|洋流|large-scale movements of seawater
blood circulation|血液循环|the movement of blood through the body
middle notes|香水中调|the scents that become noticeable after the top notes fade
moisture content|含水量|the amount of water present in something
neutral surface|化学性质相对中性的表面|a surface with relatively neutral chemical properties
skin factors|皮肤相关因素|properties of the skin that affect a process
organic compounds|有机化合物|chemical compounds based on carbon
interact with|与……相互作用|to affect and be affected by something
break away|脱离；挣脱|to separate from something
stick around|停留；持续存在|to remain in a place or continue to exist
simply put|简单来说|expressed in a straightforward way
department store|百货商店|a shop selling many types of goods in separate departments
solar system|太阳系|the Sun and the objects orbiting it
Aboriginal astronomers|原住民天文学者|Indigenous observers and interpreters of celestial phenomena
oral traditions|口述传统|knowledge and stories passed down by speaking
celestial bodies|天体|natural objects in space
Southern Cross|南十字星座|a southern constellation used in navigation
magnetic needle|磁针|a magnetised needle that aligns with a magnetic field
north pole|北极|the northern end of Earth's axis or of a magnet
human evolution|人类演化|the development of humans through evolutionary processes
stone tools|石器|tools made from stone
ice age|冰期|a long period when ice sheets cover large areas
binary system|双星系统|two astronomical objects bound by gravity
neutron star|中子星|an extremely dense remnant of a massive star
continental crust|大陆地壳|the part of Earth's outer layer forming the continents
chemical composition|化学组成|the substances and proportions making up a material
drug resistance|耐药性|reduced susceptibility to a drug
phage therapy|噬菌体疗法|using bacteria-infecting viruses to treat bacterial infections
volcanic eruptions|火山喷发|releases of magma, gas and material from a volcano
artificial agents|人工智能体|artificial systems able to act toward goals
mental states|心理状态|conditions such as beliefs, intentions and experiences
large language models|大语言模型|AI models trained on very large collections of language
hazardous industries|高危行业|industries involving substantial risks of harm
go extinct|灭绝|to disappear as a species
genetic diversity|遗传多样性|variation in genetic material within a population or species
electric charge|电荷|a property of matter that produces electromagnetic interactions
sample collection|样本采集|the process of gathering material for study
human judgement|人类判断|evaluation carried out by people
language families|语系|groups of languages descended from a common ancestor
hunter-gatherers|狩猎采集者|people who obtain food by hunting and gathering wild resources
microbial communities|微生物群落|groups of interacting microorganisms
water treatment|水处理|processes that improve water quality for a particular use
carbon dioxide|二氧化碳|a gas produced by respiration and combustion
fossil fuels|化石燃料|coal, oil and gas formed from ancient organic matter
global warming|全球变暖|an increase in Earth's average surface temperature
nitrogen cycle|氮循环|the movement of nitrogen through living systems and the environment
nitrate pollution|硝酸盐污染|contamination by excessive nitrate compounds
infectious diseases|传染病|diseases caused by pathogens that can spread
health risks|健康风险|factors that may cause harm to health
wildfire damage|野火造成的损失|harm caused by uncontrolled fires in vegetation
urban development|城市开发|the construction and expansion of urban areas
coastal erosion|海岸侵蚀|the wearing away of land along a coast
sea level|海平面|the average height of the surface of the sea
endangered species|濒危物种|species at significant risk of extinction
conservation efforts|保护行动|actions intended to protect species or ecosystems
tracking devices|追踪装置|equipment used to record locations or movements
natural habitats|自然生境|the environments where organisms naturally live
renewable sources|可再生能源来源|energy sources that are replenished naturally
energy storage|储能|keeping energy for use at a later time
waste management|废物管理|the collection, treatment and disposal of waste
artificial wetlands|人工湿地|human-created wetland habitats
natural wetlands|天然湿地|wetland habitats formed by natural processes
coral reefs|珊瑚礁|marine structures built mainly by corals
habitat loss|生境丧失|the destruction or disappearance of living environments
weather patterns|天气模式|recurring arrangements of weather conditions
nature-based solutions|基于自然的解决方案|approaches using ecosystems to address societal challenges
early prediction|早期预测|forecasting an event well before it happens
heat stress|热应激|strain on the body caused by excessive heat
chronic disease|慢性病|a condition that persists over a long period
heart muscle|心肌|the muscle tissue responsible for the heart's contractions
stem cells|干细胞|cells able to develop into specialised cell types
early detection|早期检测|identifying a condition at an early stage
muscle recovery|肌肉恢复|the repair and restoration of muscles after exertion
insulin resistance|胰岛素抵抗|reduced responsiveness of cells to insulin
biological clock|生物钟|an internal mechanism regulating biological rhythms
dietary guidelines|膳食指南|recommendations about healthy patterns of eating
fluoride toothpaste|含氟牙膏|toothpaste containing fluoride to help protect teeth
physical activity|身体活动|bodily movement that uses energy
fat cells|脂肪细胞|cells specialised for storing fat
health outcomes|健康结局|measurable effects on health following an exposure or intervention
blood tests|血液检测|tests performed on a blood sample
breast tissue|乳腺组织|tissue that makes up the breast
ice crystals|冰晶|crystalline structures formed when water freezes
time in nature|亲近自然的时间|time spent in natural environments
mental wellbeing|心理福祉|a positive state of psychological health and functioning
private schools|私立学校|schools run independently of the public school system
social class|社会阶层|a grouping based on social and economic position
language speakers|某种语言的使用者|people who speak a particular language
community spaces|社区空间|places where members of a community can gather
teacher training|教师培训|preparation for the work of teaching
science curriculum|科学课程体系|the planned content of science education
school curriculum|学校课程体系|the planned educational content taught in a school
risky play|具有一定风险的游戏|play involving uncertainty and manageable challenges
autistic young people|自闭症青少年|young people on the autism spectrum
sense of belonging|归属感|a feeling of being accepted as part of a group
school recess|课间休息|a break in the school day for play or rest
learning gaps|学习差距|differences in learning or achievement between groups
early childhood|幼儿期|the first years of a child's life
in person|面对面；亲自|while physically present with other people
standardised tests|标准化考试|tests administered and scored according to shared procedures
screen time|使用屏幕的时间|time spent looking at screens on electronic devices
material culture|物质文化|objects and physical evidence associated with a society
medieval life|中世纪生活|life during the medieval period
Roman fort|古罗马要塞|a fortified military site built by the Romans
world map|世界地图|a representation of Earth's surface
map projection|地图投影|a method of representing Earth's curved surface on a plane
public art|公共艺术|art intended to be experienced in public spaces
popular culture|流行文化|cultural activities and products widely enjoyed by the public
open-mindedness|开放包容的态度|a willingness to consider unfamiliar ideas
inner lives|内心世界|private thoughts, emotions and experiences
human vision|人类视觉|the biological and psychological processes of seeing
computer games|电脑游戏|games played using computer systems
Foley artists|拟音师|performers who create everyday sound effects for film
digital preservation|数字保存|maintaining access to digital information over time
climate risks|气候风险|potential harms arising from climate conditions or change
environmental costs|环境代价|harm to the environment caused by an activity
workplace stress|职场压力|stress associated with a person's work environment
food supply|食物供应|the provision of food to a population
hybrid work|混合办公|a pattern combining remote and workplace-based work
financial markets|金融市场|systems in which financial assets are bought and sold
wild fish|野生鱼类|fish living and reproducing outside farming systems
local businesses|当地企业|businesses operating in a particular community
corporate donations|企业捐赠|money or resources given by a company
holiday shopping|节日购物|shopping associated with a holiday season
childcare costs|托育费用|the cost of caring for young children
job growth|就业增长|an increase in the number of jobs
organic farming|有机农业|farming conducted according to organic production standards
poverty line|贫困线|an income threshold used to identify poverty
childhood poverty|儿童期贫困|poverty experienced during childhood
fragrance molecules|香气分子|molecules responsible for a scent
intermolecular forces|分子间作用力|forces acting between molecules
top notes|香水前调|the first scents noticed when a perfume is applied
base notes|香水后调|the heavier scents that last after lighter ones fade
skin microbiome|皮肤微生物群|the community of microorganisms living on the skin
magnetic field|磁场|the region where magnetic forces act
magnetic north|磁北|the northward direction indicated by Earth's magnetic field
plate tectonics|板块构造学说|the theory that Earth's outer shell is divided into moving plates
antibiotic resistance|抗生素耐药性|the ability of bacteria to survive drugs intended to kill them
radio waves|无线电波|electromagnetic waves used for communication and astronomical observations
white dwarf|白矮星|a dense stellar remnant left after a small or medium-sized star evolves
natural history|自然史；博物学|the study of organisms and the natural world through time
artificial intelligence|人工智能|computer systems designed to perform tasks involving human-like intelligence
AI agents|人工智能智能体|AI systems that can carry out tasks or take actions toward a goal
ancient DNA|古代 DNA|genetic material recovered from ancient remains
fundamental physics|基础物理学|the study of basic laws and constituents of nature
particle accelerator|粒子加速器|a machine that speeds up electrically charged particles
space mission|航天任务|an organised journey or operation in space
poison arrows|毒箭|arrows carrying a toxic substance
water quality|水质|the chemical, physical and biological characteristics of water
drinking water|饮用水|water intended to be consumed by people
carbon emissions|碳排放|releases of carbon-containing greenhouse gases into the atmosphere
carbon sinks|碳汇|systems that absorb more carbon than they release
climate change|气候变化|long-term shifts in climate patterns
early warning|预警|advance notice of a possible danger
early warnings|预警信息|advance notices of possible dangers
public health|公共卫生|the protection and improvement of health across communities
extreme weather|极端天气|unusually severe or unusual weather conditions
energy efficiency|能源效率|using less energy to achieve the same result
renewable energy|可再生能源|energy from sources naturally replenished over time
power networks|电网|interconnected systems for distributing electricity
power grid|电网|a network that carries electricity from producers to users
electricity grid|电网|an interconnected electricity supply network
bird migration|鸟类迁徙|the regular seasonal movement of birds
biodiversity loss|生物多样性丧失|a reduction in the variety of life
artificial reef|人工鱼礁；人工礁|a human-made structure that provides habitat for marine life
marine life|海洋生物|organisms living in the sea
rocky habitats|岩石生境|living environments characterised by rocks
climate adaptation|气候适应|adjustments that reduce harm from a changing climate
relative humidity|相对湿度|the amount of water vapour in air relative to its capacity at that temperature
body weight|体重|the mass of a person's body
heart attack|心脏病发作；心肌梗死|damage caused by interruption of blood flow to heart muscle
heart disease|心脏病|a condition affecting the heart
ovarian cancer|卵巢癌|cancer affecting the ovaries
blood sugar|血糖|glucose present in the blood
glucose spikes|血糖骤升|rapid temporary increases in blood glucose
circadian rhythm|昼夜节律|an approximately 24-hour biological cycle
food pyramid|食物金字塔|a diagram organising food groups into dietary guidance
tooth decay|龋齿；蛀牙|damage to teeth caused by acids produced by bacteria
bone health|骨骼健康|the strength and condition of bones
body fat|体脂|fat stored in the body
food is medicine|食物即良药|an approach that uses nutrition as part of healthcare
breast cancer|乳腺癌|cancer arising in breast tissue
cardiovascular disease|心血管疾病|disease affecting the heart or blood vessels
mental health|心理健康|a person's psychological and emotional well-being
social divisions|社会分化|separations between groups within a society
minority language|少数族群语言|a language used by a smaller group within a wider population
public libraries|公共图书馆|libraries providing services to the general public
outdoor play|户外游戏|children's play taking place outside
social media|社交媒体|online platforms for sharing content and interacting with others
public trust|公众信任|confidence that members of the public place in an institution or activity
standardized tests|标准化考试|tests administered and scored according to common procedures
digital detox|数字排毒；减少使用电子设备|a deliberate break from digital devices or online activity
first-person shooter|第一人称射击游戏|a shooting game shown from the player's viewpoint
sound effects|音效|sounds added or performed to support a film or other production
floppy disk|软盘|an older removable magnetic storage medium
supply chains|供应链|networks through which goods are produced and delivered
food security|粮食安全|reliable access to sufficient safe and nutritious food
financial decisions|财务决策|choices about managing or spending money
local job growth|当地就业增长|an increase in employment in a particular area
data centers|数据中心|buildings housing computing and data-storage equipment
data centres|数据中心|buildings housing computing and data-storage equipment
organic food|有机食品|food produced according to specified organic farming standards
long-term poverty|长期贫困|poverty that persists over an extended period
anticipatory stress|预期性压力|stress caused by expecting future difficulties
in terms of|在……方面；根据|with regard to a particular aspect
in contrast|相比之下|used to introduce an important difference
in addition|此外|used to add further information
in particular|尤其；特别是|especially or specifically
in other words|换句话说|used to express the same idea differently
as a result|因此；结果|as a consequence of something
as well as|以及；除……之外还|in addition to
rather than|而不是|instead of
due to|由于|because of
lead to|导致|to cause a result
leads to|导致|causes a result
linked to|与……有关联|connected or associated with
associated with|与……相关|connected with without necessarily implying causation
account for|解释；占……比例|to explain something or constitute a proportion
accounts for|解释；占……比例|explains something or constitutes a proportion
play a role|发挥作用|to contribute to a process or outcome
plays a role|发挥作用|contributes to a process or outcome
take into account|把……考虑在内|to consider something when making a judgement
in the long term|从长远来看|over an extended future period
on the other hand|另一方面|used to introduce a contrasting consideration
for instance|例如|for example
in advance|提前|before something happens
at risk|处于风险中|in danger of being harmed
in turn|进而；依次|as a further consequence or in sequence
in response to|回应；针对|as a reaction to something
in line with|与……一致|consistent with
make sense|有道理；说得通|to be understandable or reasonable
carry out|开展；执行|to perform a task or investigation
carried out|开展了；执行了|performed a task or investigation
draw on|借鉴；利用|to use existing knowledge or resources
rely on|依靠；依赖|to depend on
reliance on|对……的依赖|dependence on something
regardless of|不管；不论|without being affected by
in the context of|在……背景下|when considered in relation to a particular situation
by contrast|相比之下|used to highlight a difference
stem from|源于|to originate from
stems from|源于|originates from
give rise to|引起；导致|to cause something to develop
set out|着手；阐明|to begin an undertaking or state something clearly
point out|指出|to draw attention to something
end up|最终处于|to reach a situation as an eventual result
turn out|结果是；证明是|to prove to be the case
`.trim().split('\n').map(line => {
    const [term, zh, en] = line.split('|');
    return { term, zh, en };
});

export const contextualGlossary = {
    '001': {
        strip: ['纸条；狭长条', 'a long narrow piece of material'],
        interact: ['相互作用；相互影响', 'to affect and be affected by something'],
        behave: ['表现；（物质）呈现特定变化', 'to act or respond in a particular way'],
        typically: ['通常；一般而言', 'in the usual or characteristic way'],
        volatile: ['易挥发的', 'evaporating readily'],
        hydration: ['水分补充；水合状态', 'the presence or supply of water'],
        projection: ['香气的扩散程度', 'how far a perfume scent can be detected around its wearer'],
        sharper: ['（气味）更尖锐、更刺激的', 'more intense or piercing in smell'],
        metabolise: ['代谢；通过生物过程转化', 'to transform a substance through biological chemical processes'],
        rosy: ['带玫瑰香的', 'having the scent or character of roses'],
        profile: ['特征组合；特征谱', 'the combination of characteristics of something'],
        content: ['含量', 'the amount of a substance present in something'],
        oily: ['油性的；含油的', 'containing or covered with oil'],
        fruity: ['有果香的', 'having the scent or flavour of fruit'],
        hits: ['接触到；碰到', 'comes into contact with'],
        notes: ['（香水的）香调', 'individual scent characteristics within a perfume']
    }
};
