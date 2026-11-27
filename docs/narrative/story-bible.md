# Story bible

Status: filled for issue #11 (2026-11-27). The story is decided by the owner's answers of rounds 1
to 3 on #11 (2026-11-26 and 2026-11-27) and recorded in docs/decisions.md D19 to D25. This file is
the single source for story facts; every later story, art and code issue builds on it. Any story
pull request that changes a character, place, variable, writer, reader or tag updates this file in
the same pull request.

Contents: Premise, Tone, Names, Characters, Places and scene values, Timeline and endings, Memory,
Story variables, Reachability, Phase 0 outline (M1), Minigame hooks, Minigame and choice contract,
Viewpoint, The dog, Game modes, Intro storyboard, Miss Agnes, old John and the lodge, Phases 1 to 5
outline (M2 and later), Tags, Honesty check, Ink knot map, Follow-up issues, Open questions,
Change log.

## Premise

In the middle of winter, Mira and her two children, Lili and Dani, ride a hired horse cart through
a snowy wood. The cart hits a rock hidden under the snow and tips over. All three hit their heads
and wake up with bumps, headaches and no memory of their past. The carter, old John, gets up and
calls to them, but a pack of wolves howls close by. Out of fear he unties the horse and rides
away, and the wolves rush after him, away from the family.

The family did not lose a home. They lost their past: where they came from, where they were going
and why. They walk through the wood to Lark Hill's old hunting lodge, and from there to Lark Hill,
a ruined manor. The game is about surviving the winter there and building a new home, and a new
"who we are".

What only the player learns over the winter: Miss Agnes, the last of the Lark Hill family, had
hired Mira as Lark Hill's caretaker. The cart was taking them there. They had permission all along
without knowing it.

Setting: an unnamed Central-European countryside with a 1930s feel (oil lamps, wood stoves, horse
carts, a radio in the village shop), with no real historical events (owner Q5 a).

## Tone

- Bittersweet (owner Q7 b): warm and hopeful at heart, with losses that are allowed to linger for
  a moment. Rough balance: 55 % warm, 45 % sad. Humour comes mostly from Dani and Patch.
- Comfort follows a sad moment in the same scene. Sad lines may hold for a moment; they never blame
  anyone (see Honesty check).
- 12+ (docs/vision.md): hardship is cold, hunger and not knowing. No blood, no injury shown, no
  child in danger, the children are never alone outdoors at night. Dani's fever in phase 4 is the
  strongest moment (owner Q19 b) and its recovery is certain.
- The wolves appear only in the intro, at a distance, plus one distant howl on the first evening
  that fades away. They always move away from the family and never attack anyone.
- Old John is never a villain. Miss Agnes is never a threat.
- Short lines that read well on a phone screen: one thought per line, mostly under 15 words.

## Names

Ids (tags, variables, knot and stitch names, speaker ids) are language-neutral English and
identical in story/en and story/hu. Names are content and are translated as below.

| Id          | English                                        | Hungarian                                       | Note                                                                                                                                                                                    |
| ----------- | ---------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mira`      | Mira                                           | Mira                                            | Same in both.                                                                                                                                                                           |
| `lili`      | Lili                                           | Lili                                            | Same in both.                                                                                                                                                                           |
| `dani`      | Dani                                           | Dani                                            | Same in both.                                                                                                                                                                           |
| (address)   | Mama                                           | Anya                                            | How the children address Mira.                                                                                                                                                          |
| `dog`       | Patch                                          | Foltos                                          | Named for the patch over one eye. Before adoption the story says "the dog" / „a kutya”. Dani names him at adoption.                                                                     |
| `carter`    | old John (narration, Mira, the children); John | János (narration, Mira); János bácsi (children) | In English everyone says "old John" or "John". In Hungarian the children say „János bácsi”. Always "János" with the accent.                                                             |
| `heir`      | Miss Agnes (everyone)                          | Ágnes (narration); Ágnes néni (everyone)        | In Hungarian the narration says „Ágnes”, and everyone who speaks to or about her, children and adults, says „Ágnes néni”. No other form is used. Adults address her formally (magázás). |
| `lark_hill` | Lark Hill                                      | Pacsirtadomb                                    | The manor. Translated, as a descriptive name. "at Lark Hill" / „Pacsirtadombon”; adjective „pacsirtadombi”.                                                                             |
| `millbrook` | Millbrook                                      | Malompatak                                      | The village. "in Millbrook" / „Malompatakon”; adjective „malompataki”.                                                                                                                  |
| `lodge`     | the old lodge (Lark Hill's old hunting lodge)  | a régi vadászlak (a pacsirtadombi vadászlak)    | The cabin of phase 0.                                                                                                                                                                   |
| `wood`      | the wood                                       | az erdő                                         | Unnamed.                                                                                                                                                                                |
| `halt`      | the railway halt                               | a vasúti megállóhely                            | Mentioned, never shown.                                                                                                                                                                 |
| `town`      | the town                                       | a város                                         | Where Miss Agnes lives. Unnamed, mentioned, never shown.                                                                                                                                |

Translation notes (Hungarian):

- Menu items in the cabin slot menu are noun phrases („Gyűjtögetés az erdőben”). Spoken choices are
  Mira's own words in quotes („Sötétedés előtt fedelet keresünk.”).
- Hungarian quotation marks are „ and ”; a quote inside a quote uses » and «.
- Old John speaks to Mira formally (magázás) and calls her „asszonyom”. Miss Agnes speaks to the
  family in the formal plural and calls people „kedvesem” as a warm, old-fashioned touch.
- Adapt jokes and idioms instead of translating them word for word (for example, Dani's drip is
  "Gerald" in English and „Géza” in Hungarian).

## Characters

Palette roles come from docs/art-style.md (owner Q18 b): winter clothes in deep shadow #2E2347 and
cold blue #4D9DE0, with one warm accent per character. The accents grow larger and warmer as
`manor` rises (see Timeline: which variable drives which visual). The family shares one skin tone:
warm light olive #E8B98F with rosy cheeks (Q18 a). The looks of Patch, old John and Miss Agnes are
final (owner FN7 a).

### Mira (`mira`)

- Age 31. The mother, and the player's viewpoint for most of the game (owner Q14). Raised on a farm
  (owner Q16 c), which she does not remember. Lark Hill's hired caretaker, which she does not know.
- Voice: warm, practical, few words, dry humour. She thinks with her hands: they remember farm
  work, tools and animals before her head knows why. This also gives the tutorial its voice.
- Want: a safe, warm place where the children can be children again.
- Fear: that without a past she has nothing to lean on.
- Colours: a deep-shadow coat, a cold-blue skirt and a brick-red #D62828 scarf.
- Sample lines:
  - EN: "My hands remember what I don't." / "Roof first. Then we can worry, if there's time."
  - HU: „A kezem emlékszik arra, amire én nem.” / „Előbb a tető. Aztán ráérünk aggódni, ha
    marad rá idő.”

### Lili (`lili`)

- Age 11. The older child, Mira's right hand, viewpoint in a few short scenes.
- Voice: precise, serious, a little bossy and secretly funny. She keeps a notebook of everything
  they learn, and of her worries.
- Want: to be a real help, and to know what is true.
- Fear: that Mama is as lost as she is, and nobody is in charge.
- Colours: a cold-blue coat and deep-shadow boots, with friendly-green #5FAD56 mittens and scarf.
- Sample lines:
  - EN: "I'm writing it all down. If we forget again, the notebook won't." / "Dani, don't lick the
    icicle. I'm not explaining why. Just don't."
  - HU: „Mindent leírok. Ha megint elfelejtünk mindent, a füzet akkor is emlékezni fog.” / „Dani,
    ne nyald meg a jégcsapot! Nem magyarázom el, miért. Csak ne.”

### Dani (`dani`)

- Age 6. The younger child, the family's laugh, viewpoint in a few short play scenes. His
  memories come back first, as small odd fragments (a smell, half a song).
- Voice: loud, literal, names everything, asks the questions nobody else dares to.
- Want: everyone in one warm heap, and a dog.
- Fear: people going away (the carter rode off and did not come back).
- Colours: a cold-blue coat that is a size too big, with a warm-light #FFD166 knitted hat.
- Sample lines:
  - EN: "This drip is called Gerald. Gerald lives here now." / "I don't remember my old bed. I miss
    it anyway."
  - HU: „Ezt a csöpögést Gézának hívják. Géza mostantól itt lakik.” / „Nem emlékszem a régi
    ágyamra. Mégis hiányzik.”

### Patch (`dog`)

- About two years old, by his teeth. A thin stray who lives under the lodge's woodshed. An optional
  member of the family (see The dog).
- Voice: no words. Tail, ears and manners; he behaves like a polite old gentleman.
- Want: a warm spot and his own people.
- Fear: being shooed away, so he keeps a polite distance until he is asked in.
- Colours: a snow/paper #F4E9D8 coat, with a deep-shadow #2E2347 patch over one eye and on the ear
  tips. As a stray he has no accent. Once adopted, he gets a collar that Lili knits from the ends of
  her friendly-green scarf.
- Sample lines (narration):
  - EN: "The dog takes the crust as politely as a gentleman." / "Patch thumps his tail on the
    floor."
  - HU: „A kutya olyan finoman veszi el a héjat, mint egy úriember.” / „Foltos a farkával dobol a
    padlón.”

### Old John (`carter`)

- About 60. A hired carter from Millbrook (owner FN3 a). He drove the family from the railway halt
  towards Lark Hill, fled from the wolves, and is met again in phase 2.
- Voice: gruff, short sentences, honest to a fault. Calls Mira "missus".
- Want: to make it right.
- Fear: that he is a coward, and that his running cost them dearly.
- Colours: a deep-shadow coat and cap and cold-blue trousers, with a fire #F77F00 muffler the
  colour of the cart lantern. Skin: a deep weathered tan #C68B5E, a ruddy nose and white stubble.
- Sample lines:
  - EN: "We went back for you, as soon as the road opened." / "The horse ran, and I ran with him.
    I'm not proud of it, missus."
  - HU: „Visszamentünk magukért, amint járható lett az út.” / „A ló futott, én meg vele. Nem vagyok
    rá büszke, asszonyom.”

### Miss Agnes (`heir`)

- In her late seventies. An elderly lady, the last of the Lark Hill family, living in town (owner
  FN6 a). She hired Mira as caretaker at one meeting in town and told her to go up in January and
  start. She comes at the thaw, once the roads open, and appears in all four endings.
- Voice: brisk, kind and old-fashioned, with a dry wit. Calls people "dear".
- Want: the house alive again, more than she wants it back.
- Fear: that Lark Hill dies with her, the last of the family.
- Colours: the only light coat in the game, a long snow/paper #F4E9D8 travelling coat that arrives
  with the spring, a deep-shadow hat and a warm-light #FFD166 hat ribbon that echoes Dani's hat.
  Skin: a light rosy tone, about #F2CDB4, with the lines of an elderly lady and white hair under the
  hat.
- Sample lines:
  - EN: "I didn't want it back. I wanted it lived in." / "Grandfather's sermons. Nobody ever read
    them, dear."
  - HU: „Nem visszakapni akartam. Azt akartam, hogy éljen benne valaki.” / „Nagyapám prédikációi.
    Soha senki nem olvasta őket, kedvesem.”

Millbrook's other people (the shopkeeper who is also the postmistress, the miller, the butcher,
neighbours) are minor roles without names until a story issue needs one; a name is then an owner
decision (naming trigger).

## Places and scene values

The tag key `scene` is supported (docs/architecture.md). No value can be shown yet, because there is
no art and no scene display. M1 values are planned for M1 and need the M1 art issue and the
scene-display issue. M2 and later values are proposed, not promised.

| `scene` value      | Place                                                          | Mood                                     | Used in                                     | Status       |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------- | ------------ |
| `wood_road`        | The cart road through the wood                                 | Hushed blue dusk, then a cartoon tumble  | Intro, crash                                | M1           |
| `cart_camp`        | The tipped cart under the tarp                                 | Scared, then lantern-cosy                | P0-1, the night at the cart, trunk walk     | M1           |
| `wood_path`        | The footpath to the lodge                                      | Tired dusk, relief at the carved lark    | Walk to the lodge                           | M1           |
| `wood_clearing`    | Rose hips and the squirrel's store                             | Crisp, bright, a small triumph           | Forage slot                                 | M1           |
| `cabin`            | Lark Hill's old hunting lodge, inside and at the woodshed door | Dusty and cold, warmer with each task    | Cabin days, nights, first dog chance        | M1           |
| `cabin_loft`       | The lodge loft                                                 | Secret, curious, dust in the light       | Loft slot (Lili)                            | M1           |
| `manor_gate`       | Lark Hill's gate at dusk                                       | Awe, a little fear, the name on the gate | Last M1 beat, phase 1 arrival               | M1           |
| `courtyard`        | Lark Hill courtyard                                            | Frosty morning, a fresh start            | Second dog chance, henhouse                 | M2, proposed |
| `manor_hall`       | The hall                                                       | Vast and echoing, later full of candles  | First night, the feast                      | M2, proposed |
| `manor_kitchen`    | The kitchen                                                    | Small, sooty, the warmest room           | First night, meals, the sickbed             | M2, proposed |
| `manor_library`    | The library                                                    | Dusty shelves, lamp-lit                  | Fuel choice, bedtime, sorting the books     | M2, proposed |
| `root_cellar`      | The forgotten root cellar                                      | Dark, then a treasure find               | Patch digs it out (phase 2)                 | M2, proposed |
| `manor_roof`       | The roof                                                       | Windy and high, the valley below         | Repairs, chimney, after the storm           | M2, proposed |
| `millbrook_square` | Millbrook square                                               | Busy, curious, later festive             | First trip, spring market in the epilogue   | M2, proposed |
| `millbrook_shop`   | The shop, which is also the post office                        | Warm, chatty                             | Lili's errand, gossip                       | M2, proposed |
| `millbrook_mill`   | The mill                                                       | Flour dust, a creaking wheel, friendly   | Work at the mill, the stray in the epilogue | M2, proposed |

Story places with no `scene` value (mentioned, never shown): the railway halt (old John's and Miss
Agnes's words), the river where the pack lost interest (old John's words) and the town where Miss
Agnes lives and met Mira. If a later issue shows one of them, it gets a value then.

## Timeline and endings

| Phase              | When                        | Milestone      | Family state                                                                           | Manor state                                    |
| ------------------ | --------------------------- | -------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 0. The wood        | Early January, 2 to 4 days  | M1             | No past, bruised, scared and close. They learn the lodge, their skills and each other. | Not seen until the gate: a dark roof at dusk.  |
| 1. First night     | The evening after the lodge | M2 (starts M2) | Tired and awed. The first promise. The second dog chance next morning.                 | A ruin with one usable room (kitchen or hall). |
| 2. Settling in     | The first week              | M2 or later    | Routines. First trip to Millbrook, old John, the first facts from outside.             | Two repairs; `manor` 1 to 5.                   |
| 3. Midwinter feast | Late January                | Later          | A hope peak. The promise is tested. Gossip about Miss Agnes's notice.                  | The chimney; candles in the hall.              |
| 4. The long cold   | February                    | Later          | The hardest stretch: the storm, Dani's fever or a sniffle, who comes to help.          | Storm damage and the repair after it.          |
| 5. Thaw            | March                       | Later          | Miss Agnes arrives. The ending and the epilogue.                                       | As the winter left it; `manor` 1 to 9.         |

The midwinter feast is Millbrook's own winter feast, with candles and a small fir: a Christmas
feel, no religious content.

### Endings

Checked once, at the thaw (phase 5), in this order; the first match wins:

1. **Together**: `village` ≥ 7 and `manor` ≥ 3. Miss Agnes and Millbrook finish Lark Hill with the
   family, and she asks them to make it their home. Closing picture: the family on the front steps,
   Millbrook folk filling the courtyard, Miss Agnes among them.
2. **Home**: `manor` ≥ 6 and `hope` ≥ 3. Miss Agnes finds the house alive again and asks them to stay
   for good. Closing picture: the family at the open front door, smoke rising from the chimneys.
3. **Shelter**: `manor` 3 to 5, or `manor` ≥ 6 with `hope` ≤ 2 ("the house is ready before their
   hearts are"). They stay on as caretakers, with her blessing and much still to do. Closing
   picture: the family at the one bright window, ladders still against the wall.
4. **Moving on**: `manor` ≤ 2. Miss Agnes arrives while they are packing, gives Mira her letter in
   person and keeps the caretaker post open for when the house can be lived in. They leave by their
   own choice, knowing who they are now. It is never a punishment. Closing picture: the family on
   the road below the gate, looking back, Miss Agnes waving from it.

Starting values meet no ending, because endings are only checked at the thaw. Miss Agnes's line in
every ending where she welcomes them (Together, Home, Shelter): "I didn't want it back. I wanted it
lived in." / „Nem visszakapni akartam. Azt akartam, hogy éljen benne valaki.”

Each ending ends on one closing picture of the family, with Patch if `dog` = "ours".

### Which variable drives which visual

- `manor` drives the size and warmth of the costume accents and the colour of the restored rooms,
  in bands 0 to 2 / 3 to 5 / 6 to 10 (owner Q18 b), during the winter and in the closing picture.
- `hope` drives the light: the sky, the lamp glow and the colour temperature of the whole picture,
  in bands 0 to 2 (quiet and tender) / 3 to 5 (steady) / 6 to 10 (bright, with a song). This fits
  "colours grow warmer with hope" in docs/art-style.md.
- So the closing picture takes its costumes from `manor` and its light from `hope`. The game reads both
  through src/story/runner.ts. Showing this is a proposal for the art and scene-display issues, not
  a promise.

### Epilogue lines

After the ending scene, one line per variable band, in every ending:

| Variable          | Band                        | Line (content)                                                                                                                                                                                                                                                                                                                             |
| ----------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `memory`          | 0 to 1 / 2 to 3 / 4 to 5    | See Memory.                                                                                                                                                                                                                                                                                                                                |
| `warmth`          | 0 to 2 / 3 to 5 / 6 to 10   | February in one room round the stove, then the first sunny day outside / the windows open for the first time in March / in March they forget to light the stove, and nobody notices.                                                                                                                                                       |
| `food`            | 0 to 2 / 3 to 10            | The first spring meal is nettle soup with Millbrook's bread / the saved seed potatoes are planted in the garden (taken along in Moving on).                                                                                                                                                                                                |
| `trust`           | 0 to 3 / 4 to 6 / 7 to 10   | Lili shows Mira the notebook of worries, and they talk / Lili asks a hundred questions about the garden / Lili and Mira plan the spring together, as equals.                                                                                                                                                                               |
| `village`         | 0 to 2 / 3 to 6 / 7 to 10   | Their own small thaw supper / neighbours come up with seedlings / Millbrook comes to the thaw feast.                                                                                                                                                                                                                                       |
| `promised_home`   | true / false                | True: "You kept your word, Mama." (Together, Home), "Not finished. Still ours." (Shelter); in Moving on Mira tells the truth about the promise: at `trust` ≥ 5 Lili says "Home is us.", below 5 a quiet talk and a new promise they can keep. False: Miss Agnes hears that Mira never claimed the house, and that honesty wins her warmth. |
| `burned`          | books / furniture / nothing | Miss Agnes notices the gap on the shelf: "Grandfather's sermons. Nobody ever read them, dear." / she notices the missing chairs, gently / she finds every room as it was, only cleaner.                                                                                                                                                    |
| `dog`             | ours / none                 | Patch at the table and in the picture / a stray at the mill wags at them.                                                                                                                                                                                                                                                                  |
| `carter_forgiven` | true / false                | Old John drives them to the spring market / he tips his hat to them from across the square.                                                                                                                                                                                                                                                |

Every ending also has Miss Agnes's lodge line: "So you found the old lodge. I spent my summers there
as a girl." / „Szóval megtalálták a régi vadászlakot. Lánykoromban ott töltöttem a nyarakat.” The
closing thought of the game, in every ending: "We don't remember who we were. We know who we are."
/ „Nem emlékszünk, kik voltunk. De tudjuk, kik vagyunk.”

## Memory

Owner FN1 b: the old life never fully comes back. Fragments return over the winter, and facts come
from outside.

- **What stays:** each of them knows their own name and the other two, and that they belong
  together. Skills stay: Mira's hands know farm work, tools and animals; Lili can read, write and
  reckon; Dani knows songs he cannot place.
- **What is lost:** everything before the crash: where they came from, where they were going, why,
  and who they were to anyone else.
- **What they re-learn (facts from outside):** the luggage tag ("Lark Hill"), the lodge map and
  guest book (where the big house is, and that someone once loved the lodge; neither names anyone,
  see "The lodge" under Miss Agnes, old John and the lodge), old John (where he picked them up and where they asked to go), Millbrook's gossip
  about Miss Agnes's notice, and at the thaw Miss Agnes herself (who hired Mira, and that they came
  by train).
- **Fragments (from inside):** Dani's half-song and smells; Lili's school (first in the loft, where she reads joined-up writing as easily as print and knows somebody taught her); Mira's farm and a red cow,
  which slip out in a bedtime story.
- **Sources of `memory`** (each counts once, maximum 5): the trunk (the cart night or the walk back,
  never both), the loft and its guest book, the books bedtime (phase 1, only if `burned` = "books"),
  old John (always, phase 2), the feast story told from memory, the children's gift "the song", and
  the fever tea (phase 4, only at fever with `village` < 3).
- **The best epilogue needs no hardship:** the trunk, the loft, old John, the feast story from
  memory and the song make 5 on a warm path that keeps the books and has no fever. Its price is
  ordinary trade-offs (cabin slots, and `hope` given up in the feast story and the gift). The books
  bedtime and the fever tea are alternative routes, not the only ones.

What `memory` sets in the epilogue (it never changes which ending they get, only what they know in
it):

- **0 to 1:** they know only what Miss Agnes tells them: who hired Mira, and that they came by
  train. (At the thaw `memory` is never below 1, because old John always gives +1.)
- **2 to 3:** their own fragments also line up with those facts: Dani's half-song is a lullaby from
  the town they came from, and Lili remembers her school.
- **4 to 5:** Mira also knows where she comes from: the farm and the red cow from the bedtime story
  were her childhood home, a place she can now name.

Questions that stay open for later chapters (never answered in this winter): the name of the town
they came from and who they knew there, why Mira took a caretaker post far from it, and whether
Mira's childhood farm still stands. No question about a father is raised (see Miss Agnes, old John
and the lodge: the father).

## Story variables

Every number is changed through one ink function that clamps it to the row's range (the developer
fixes the final form, for example `change(ref var, amount)` built on MIN and MAX). A value pushed past
its range stops at the bound; the line the story would show is still shown, and no number is ever
shown to the player. Ink never reads the game mode (`game_mode` is a game setting stored with the
save, not an ink variable). Once-only beats (forage, the loft, `cabin_cold`) use ink visit counts, not
variables.

| Variable          | Type and range                          | Start                         | Meaning                                                                     | Written by                                                                                                                                                                                                                                                                                                                                                                 | Read by                                                                                                                                                                                                              |
| ----------------- | --------------------------------------- | ----------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `warmth`          | int, 0 to 10                            | 3                             | How warm the family and their room are                                      | P0-1 stay -1; cabin fire and patch bands; cabin nights -1 per undone task; `cabin_cold` +1 (once); phase 1 kitchen +1, books or furniture +1, kindling +1, fire band; phase 2 first repair +1, roof of the base room +1; phase 4 Lili's fire band, storm -1, old John's firewood +2                                                                                        | Cabin night lines (≤ 2 / 3 to 5 / ≥ 6), `cabin_cold` (0), phase 1 morning (≤ 3 / 4 to 5 / ≥ 6), phase 4 opening (≤ 3: fever, else a sniffle), epilogue                                                               |
| `food`            | int, 0 to 10                            | 1                             | Food in store                                                               | P0-1 stay +2, trunk walk +2, forage +2; each cabin meal -1; adopting Patch -1 (either chance); phase 1 proper supper -1; phase 2 Millbrook trip +2, bone into the soup +1, root cellar +2, henhouse +1; phase 3 feast with Millbrook -1; phase 4 the family eats first +1; "make it right" a) -1                                                                           | Food cost rule (at 0 a cost becomes `hope` -1, the thin barley), phase 1 breakfast (≥ 1), epilogue (≤ 2 / ≥ 3)                                                                                                       |
| `hope`            | int, 0 to 10                            | 2                             | Morale; belief that a new life can be built                                 | P0-1 stay -1, explore +2; refusing Patch -1 (either chance); poor and good bands +1; rest and play +2; food cost at 0 -1; phase 1 promise +2, hall +1, fire band, proper supper +1, bedtime book +1; phase 2 snow fort +1, sorting the library +1; phase 3 promise beat ±1, family feast +1, book story +1, the song +1, lanterns +2; phase 4 help +1, Patch by the bed +1 | Children's evening lines (≤ 2: quiet, with comfort in the same scene; ≥ 3: chatty), light of every scene and of the closing picture (0 to 2 / 3 to 5 / 6 to 10), endings (Home ≥ 3, Shelter at `manor` ≥ 6 with ≤ 2) |
| `trust`           | int, 0 to 10                            | 5                             | How much the children rely on Mira's word, now that she doesn't know either | P0-1 explore +1; fair cabin bands +1; the loft +1; phase 1 "It isn't ours" +2, morning tea after a fair fire +1; phase 2 keep a distance from old John +1; phase 3 promise beat (+1, or +1 and -2 by choice)                                                                                                                                                               | Phase 1 morning (≥ 7: Lili asks "Are we staying?"), phase 2 Lili's errand (≥ 6), Moving-on promise line (≥ 5), epilogue (0 to 3 / 4 to 6 / 7 to 10)                                                                  |
| `village`         | int, 0 to 10                            | 0                             | Standing with Millbrook (written from phase 2)                              | Phase 2 Millbrook trip +1, Lili's errand +1, forgive old John +1, work at the mill +2; phase 3 invite Millbrook to the feast +2; phase 4 help Millbrook after the storm +2                                                                                                                                                                                                 | Phase 4 help at the fever (≥ 3), Together ending (≥ 7), epilogue (0 to 2 / 3 to 6 / 7 to 10)                                                                                                                         |
| `manor`           | int, 0 to 10                            | 0                             | How much of Lark Hill is repaired (written from phase 2)                    | Phase 2 first repair +1 / +2 / +3 by band, roof of the base room +2, henhouse +1; phase 3 chimney +1 / +2 / +3 by band; phase 4 storm -2 (-1 with a well Patch), the roof +2 or Millbrook's help +1                                                                                                                                                                        | Phase 3 promise beat (≤ 3 / ≥ 4), endings, costume accents and restored rooms (0 to 2 / 3 to 5 / 6 to 10)                                                                                                            |
| `memory`          | int, 0 to 5                             | 0                             | Recovered fragments and facts of the past                                   | The trunk +1, the loft +1, phase 1 books bedtime +1, phase 2 old John +1, phase 3 feast story from memory +1, the song +1, phase 4 fever tea +1                                                                                                                                                                                                                            | Epilogue (≤ 1 / 2 to 3 / ≥ 4)                                                                                                                                                                                        |
| `camp`            | string: "", "cart", "wood"              | ""                            | The first decision of the game                                              | P0-1                                                                                                                                                                                                                                                                                                                                                                       | Day 1 slot count (2 or 1), arrival line at the lodge (midday or dusk)                                                                                                                                                |
| `trunk`           | bool                                    | false                         | The family has the cart's trunk (blankets, food, the luggage tag)           | P0-1 stay, trunk walk                                                                                                                                                                                                                                                                                                                                                      | Slot menu (the trunk walk is offered while false), patch input (the tarp or boughs and moss), gate line (the tag matches the name on the gate)                                                                       |
| `cabin_days`      | int, 0 to 4                             | 0                             | Nights spent at the lodge                                                   | Each cabin night +1                                                                                                                                                                                                                                                                                                                                                        | Leave choice (offered at 2 and 3, departure after 4), gate line (2 / 3 / 4), kindling at the first manor fire (2 / 3 / 4)                                                                                            |
| `dog`             | string: "none", "ours"                  | "none"                        | Patch's place in the family                                                 | First dog chance (lodge, first evening), second dog chance (courtyard, first morning at Lark Hill)                                                                                                                                                                                                                                                                         | Every dog scene; the second chance (offered only at "none"); the gate image; every `dog_care` writer and reader; epilogue and closing picture                                                                        |
| `dog_care`        | int, 0 to 10                            | 0 (set to 4 or 3 at adoption) | How safe and well Patch is (only while `dog` = "ours")                      | Adoption (4 at the lodge, 3 in the courtyard); rest and play +1; phase 1 proper supper +1; phase 2 Dani's dog bed +1, bone into the soup -1 or bone for Patch +2; phase 3 feast with Millbrook -1; phase 4 Lili keeps house +1, the family eats first -2 or share the last sack +1; "make it right" +3 or +2                                                               | Phase 2 root cellar (≥ 7), phase 4 Patch by the bed (≥ 5), storm bark (≥ 7), thin and quiet scene with "make it right" (≤ 2, phases 2 to 4), flavour lines (3 to 6)                                                  |
| `promised_home`   | bool                                    | false                         | Mira promised that Lark Hill will be home                                   | Phase 1 choice 1 a                                                                                                                                                                                                                                                                                                                                                         | Phase 3 promise beat, epilogue (and Moving-on promise line)                                                                                                                                                          |
| `night_room`      | string: "", "kitchen", "hall"           | ""                            | The first base room                                                         | Phase 1 choice 2                                                                                                                                                                                                                                                                                                                                                           | Phase 1 fire input, morning background, phase 2 first repair target (hall: the roof hole; kitchen: the window), phase 4 sickbed room                                                                                 |
| `burned`          | string: "nothing", "books", "furniture" | "nothing"                     | What became fuel on the first manor night                                   | Phase 1 choice 3                                                                                                                                                                                                                                                                                                                                                           | Phase 1 fire input ("nothing": damp branches, the hardest start), bedtime (books: a story from memory), phase 3 feast story (the book option only if not "books"), epilogue                                          |
| `carter_forgiven` | bool                                    | false                         | Mira forgave old John                                                       | Phase 2 old John choice a                                                                                                                                                                                                                                                                                                                                                  | Phase 4 old John's firewood (`warmth` +2), epilogue                                                                                                                                                                  |
| `mg_fire`         | string: "", "poor", "fair", "good"      | ""                            | Band of the last fire minigame ("" = not played at the lodge yet)           | The game, after `# minigame: fire` (lodge, first manor night, phase 4 as Lili)                                                                                                                                                                                                                                                                                             | The beat right after each fire, cabin slot menu (offered while ""), cabin nights (`warmth` -1 while ""), phase 1 morning tea ("fair": `trust` +1)                                                                    |
| `mg_patch`        | string: "", "poor", "fair", "good"      | ""                            | Band of the last patch minigame ("" = not played at the lodge yet)          | The game, after `# minigame: patch` (lodge roof hole, phase 2 first repair, phase 3 chimney)                                                                                                                                                                                                                                                                               | The beat right after each patch, cabin slot menu (offered while ""), cabin nights (`warmth` -1 while "")                                                                                                             |

### Clamp, floor and food cost rules

- **Clamp:** see above. `memory` stops at 5, every other number at 0 and 10.
- **Floors never end the story.** There is no game over. At a floor the story continues,
  differently:
  - `warmth` 0: the first time a cabin night ends at 0, stitch `cabin_cold` runs (see Phase 0). Later
    nights at 0 are one heap under every coat, with one short line and no number change. Morning
    always comes.
  - `food` 0: the food cost rule below; nobody goes without.
  - `hope` 0 to 2: the children are quiet and miss small things; Mira answers with a near goal, and
    comfort follows in the same scene. Low `hope` never makes the family leave.
  - `trust` low: Lili keeps her worries in her notebook; the epilogue gives them the talk.
  - `village` low: the family manages alone, in different scenes, with no penalty text.
  - `manor` low: living in one room is a normal winter state; only the thaw value counts, and Moving
    on is the family's own decision.
  - `dog_care` ≤ 2: Patch is thin and quiet, shown gently, and Mira always notices and gets the
    "make it right" choice in the same scene.
- **Food cost rule:** every food cost works the same way. If `food` is 0, the cost becomes `hope` -1
  instead (the thin barley from the lodge jar, or the last of the flour at Lark Hill), and nobody
  goes without. This applies to cabin meals, adopting Patch, the phase 1 supper, the feast and "make
  it right" a).

## Reachability

The values below come from a full model of the outline: a script that plays every path (every
choice and every band) with clamping, using the writers in this file. It was re-run for this file
with the rule that the Stay branch's first evening includes at least one of fire or patch, and with
the second dog chance on the first morning at Lark Hill. That gives about 6.1 million distinct
states at the thaw. The script and its output are in the pull request description of #11. Every
story issue that changes a writer re-runs it and updates this table in the same pull request.

| Variable                       | Gate (end of M1) | End of phase 2 | Thaw (ending check) |
| ------------------------------ | ---------------- | -------------- | ------------------- |
| `warmth`                       | 0 to 7           | 1 to 10        | 0 to 10             |
| `food`                         | 0 to 3           | 2 to 7         | 1 to 8              |
| `hope`                         | 0 to 8           | 0 to 10        | 1 to 10             |
| `trust`                        | 5 to 9           | 5 to 10        | 3 to 10             |
| `village`                      | 0 (not written)  | 1 to 5         | 1 to 9              |
| `manor`                        | 0 (not written)  | 1 to 5         | 1 to 9              |
| `memory`                       | 0 to 2           | 1 to 4         | 1 to 5              |
| `dog_care` (if `dog` = "ours") | 4 to 7           | 3 to 10        | 3 to 10             |

Every read threshold is reached both ways (true and false):

- Cabin nights: `warmth` ≤ 2 / 3 to 5 / ≥ 6, the barley meal (`food` 0). At the gate: `cabin_days` 2, 3
  and 4, `trunk` and `dog`.
- Phase 1 morning: `warmth` ≤ 3 / 4 to 5 / ≥ 6, `trust` ≥ 7, `food` ≥ 1.
- Phase 2: `trust` ≥ 6 (Lili's errand); root cellar `dog_care` ≥ 7 (for example: adopted at the lodge
  4, one rest and play 5, the phase 1 supper 6, the bone for Patch 8). A Patch adopted in the
  courtyard reaches at most 6 by the root cellar, so the root cellar is a lodge Patch's find; the
  storm bark is reachable for both.
- `dog_care` ≤ 2 ("make it right"): reached in phases 2, 3 and 4 (the bone into the soup, the feast
  with guests, the last sack).
- Phase 3 promise beat: `manor` ≤ 3 and ≥ 4.
- Phase 4: fever (`warmth` ≤ 3 at the opening; the range there is 1 to 10), `village` ≥ 3, `dog_care` ≥ 5
  (Patch by the bed), `dog_care` ≥ 7 (the storm bark), `carter_forgiven`.
- Epilogue: `memory` ≤ 1 / 2 to 3 / ≥ 4, `hope` 0 to 2 / 3 to 5 / ≥ 6, `trust` 0 to 3 / 4 to 6 / ≥ 7
  (and the Moving-on promise line ≥ 5 / < 5), `food` ≤ 2 / ≥ 3, `warmth` and `village` in all three
  bands.

Endings: all four are reached. As a share of distinct thaw states (not of players): Together 24 %,
Home 28 %, Shelter 33 %, Moving on 15 %. Shelter with `manor` ≥ 6 and `hope` ≤ 2 is also reached.

- Together (`village` ≥ 7): the first trip 1, Lili's errand 1, forgiving old John 1, work at the mill 2 and
  inviting Millbrook to the feast 2 make 7 by the end of phase 3; helping Millbrook after the storm
  adds 2 more (9 at most).
- Home (`manor` ≥ 6): with fair repair bands and the house first, 2 + roof 2 + chimney 2 - storm 2 +
  roof 2 = 6. With good bands it is 8, or 9 when a well Patch barks before the storm.
- The minigame bands alone never cause Moving on: with every repair band poor but the house chosen
  first, `manor` ends at 3 or 4 (Shelter). Moving on needs at least one choice that puts the village
  or the henhouse before the house.

Phase 0 balance (P0-1): 22 % of the Stay end states and 26 % of the Explore end states at the gate
are not beaten on every count (`warmth`, `food`, `hope`, `trust`, `memory`) by any end state of the
other choice, so neither choice dominates.

## Phase 0 outline (M1)

From the crash to the Lark Hill gate. Length: 2 to 4 days at the lodge. Start values: `warmth` 3,
`food` 1, `hope` 2, `trust` 5, `memory` 0. Before the story, the start screen offers the game mode (a UI
element, not a story choice), so P0-1 is the first choice.

### 0. Intro (`wood_road`)

`# cutscene: intro_crash` (proposed), then the fallback narration (see Intro storyboard). The text is
the same with or without the animation.

### 1. The cart, late afternoon (`cart_camp`): choice P0-1

Mira wakes by the tipped cart. Lili. Dani. She knows their names, and nothing else. The carter is
gone, and so is the horse. Writes `camp`.

- a) **Stay.** EN: "We stay with the cart. Someone will come." / HU: „A szekérnél maradunk. Valaki
  majd jön.” A shelter under the cart with the tarp, a lantern and a story. They search the trunk:
  `trunk` = true, `food` +2, `memory` +1 (a luggage tag reads "Lark Hill", a name they don't
  understand). Nobody comes back. A cold night: `warmth` -1, `hope` -1. A distant howl, fading away.
  In the morning they follow a footpath and reach the lodge at midday, with **2 slots** on day 1.
- b) **Explore.** EN: "We find a roof before dark." / HU: „Sötétedés előtt fedelet keresünk.” Mira
  lets Lili lead, and Lili spots the carved lark over a door first: `trust` +1. A roof before dark:
  `hope` +2. The trunk stays at the cart. They arrive at dusk, with **1 slot** that must be fire or
  patch.
- Read later by: the day 1 slots, the trunk walk, the patch input, the gate line (the tag), the
  epilogue (`memory`). Neither branch is wrong: staying buys supplies and the clue, exploring buys
  spirits and Lili's trust.

### 2. The lodge (`wood_path`, then `cabin`)

The carved lark over the door. Inside: dust, a cold stove, a hole in the roof, a woodbox, a bench
chest, and an old estate map on the wall that shows the lodge, the valley path and a manor two hours
away. Mira: "My hands remember what I don't."

### 3. The slot menu and the tutorial (`cabin`)

The tutorial is the lodge from arrival to the first leave choice. It explains choices and
consequences by story, in plain words, with no long rules text. Cost hints appear only here, as
UI strings at four spots that ink marks with `# tutorial: <id>` (proposed). The wording is a proposal
for the tutorial-hint issue (t() keys), not story text:

| Id            | Where                    | EN                                                                                             | HU                                                                                                       |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `slot_costs`  | The first slot menu      | A day has room for only a few tasks. A task left for later can make the night colder.          | Egy napba csak kevés feladat fér. Ami későbbre marad, attól hidegebb lehet az éjszaka.                   |
| `band_result` | After the first minigame | How well it went shapes what comes next. A poor result is a different story, never a dead end. | Hogy mennyire sikerült, az alakítja a folytatást. A gyengébb eredmény más történetet hoz, nem zsákutcát. |
| `night_cost`  | The first cabin night    | Every evening costs a meal. Unfinished tasks make the night colder.                            | Minden este egy étkezésbe kerül. A befejezetlen feladatoktól hidegebb az éjszaka.                        |
| `leave_cost`  | The first leave choice   | One more day gives one more task, and costs one more meal.                                     | Még egy nap még egy feladatot ad, és még egy étkezésbe kerül.                                            |

**No cost hint appears in any later phase.** After the tutorial there is no cost hint, no cost note
in choice text and no number preview anywhere. Choice text, in the tutorial too, names only what
Mira does. Consequences are shown after the fact, in story lines.

Slots: arriving at dusk (Explore), Mira must pick fire or patch. Arriving at midday (Stay), she has
2 slots and at least one of them must be fire or patch; the other is free, so she can do both or
leave one undone (owner Q12). Each later day has 1 slot. The menu (EN / HU):

| Option                                                        | Played as         | Minigame or result                                                                | Repeat                         |
| ------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------- | ------------------------------ |
| Light the stove / A kályha begyújtása                         | Mira              | `# minigame: fire` (dry wood from the woodbox: an easy start)                     | Once                           |
| Patch the roof hole / A tetőlyuk befoltozása                  | Mira              | `# minigame: patch` (the tarp if `trunk`, otherwise pine boughs and moss: harder) | Once                           |
| Walk back to the cart / Séta vissza a szekérhez               | All three, by day | `trunk` = true, `food` +2, `memory` +1                                            | Once, only if `trunk` is false |
| Forage in the wood / Gyűjtögetés az erdőben (`wood_clearing`) | Mira              | Rose hips and a squirrel's hazelnut store: `food` +2                              | Once                           |
| Explore the loft / A padlás felfedezése (`cabin_loft`)        | Lili              | The guest book, last entry in Miss Agnes's own hand: `memory` +1, `trust` +1      | Once                           |
| Rest and play / Pihenés és játék                              | Dani              | `hope` +2, and `dog_care` +1 if Patch is theirs                                   | Repeatable                     |

Tutorial tag lines in the ink (#13): `slot_costs` on the first menu prompt "Mira rolls up her
sleeves. Where to begin?" / „Mira feltűri az ingujját. Hol kezdje?” (later prompts: "Mira looks
around. What next?" / „Mira körülnéz. Mi legyen a következő?”); `band_result` on "Mira brushes off
her hands." / „Mira leporolja a kezét.”, right after the first band line; `night_cost` on the
night's opening line "Evening comes to the lodge." / „Beesteledik a vadászlakban.” Each sits at the
end of a plain text line outside any choice or conditional, once, on the same line in story/hu, and
never on a line with `# minigame:`.

### 4. The first evening: the first dog chance (`cabin`, at the woodshed door)

"A thin dog watches from under the woodshed. One eye sits in a dark patch." / „Egy sovány kutya
figyel a fáskamra alól. Az egyik szeme egy sötét foltban ül.” Dani: "Mama, can he have my crust?
He's looking at it." / „Anya, megkaphatja a kenyérhéjamat? Nagyon nézi.”

- a) "Let him have it." / „Hadd egye meg.” `food` -1 (food cost rule), `dog` = "ours", `dog_care` = 4.
  Mira: "Go on, then. Slowly, so he isn't scared." / „Jól van. Csak lassan, hogy meg ne ijedjen.”
  The dog takes the crust as politely as a gentleman. Dani: "He's got a patch, like a pirate. He's
  Patch!" / „Folt van a szemén, mint egy kalóznak. Ő lesz Foltos!”
- b) "We need it ourselves tonight." / „Ma este nekünk is kell.” `hope` -1, because Dani is sad.
  Mira: "Not tonight, love. Let's see what we find first." / „Ma este még nem, kicsim. Előbb nézzük
  meg, mit találunk.” Dani: "Bye, dog. Don't go far." / „Szia, kutya. Ne menj messzire.” The dog
  curls up under the woodshed, close enough to watch them. Lili: "He's guarding us. We've got a
  night watchman, and he's free." / „Vigyáz ránk. Lett egy éjjeliőrünk, ráadásul ingyen.” Dani
  giggles into his sleeve.
- Read later by: every dog scene, the gate image, the second chance, the endings' closing picture.
  After Explore, adopting takes `food` from 1 to 0, so that night is barley; after Stay it goes from 3
  to 2.

### 5. Each cabin night (`cabin`)

- The evening meal costs `food` -1 (food cost rule). At 0: "Supper is thin barley from the jar on
  the shelf. It fills them, just." / „Vacsorára híg árpakása a polcon álló bödönből. Épp hogy
  jóllaknak.”
- Each task not done yet (`mg_fire` or `mg_patch` still "") costs `warmth` -1, with a line that names the
  thing, never the time:
  - Patch undone: "The roof hole whistles all night. They sleep in their coats." / „A lyuk a tetőn
    egész éjjel fütyül. Kabátban alszanak.”
  - Fire undone: "The stove stays cold. Three noses, one blanket." / „A kályha hideg marad. Három
    orr, egy takaró.”
  - A consequence line may name the trade, with no blame: Lili: "Rose hips for supper, and a hole
    for a ceiling." / Mira: "We chose the rose hips. Tonight we pay for them in socks." / Dani: "I'm
    wearing four!" / HU: Lili: „Csipkebogyó vacsorára, a plafon helyén meg egy lyuk.” / Mira: „A
    csipkebogyót választottuk. Ma éjjel zokniban fizetünk érte.” / Dani: „Rajtam négy van!”
- The night line reads `warmth`: ≤ 2 "They sleep in one heap under every coat." / „Egy kupacban
  alszanak, minden kabát alatt.”; 3 to 5 "The stove ticks. Nobody's toes are warm, but nobody
  complains." / „A kályha pattog. Senkinek sem meleg a lábujja, de senki sem panaszkodik.”; ≥ 6
  "Dani kicks off his blanket in his sleep. The lodge is warm." / „Dani álmában lerúgja a takarót.
  Meleg van a vadászlakban.”
- **Stitch `cabin_cold` (the "find warmth" scene).** The first time a cabin night ends at `warmth` 0,
  Lili finds two old feather quilts in the bench chest, and all of them sleep in one heap (Patch on
  their feet, if he is theirs): `warmth` +1. Once only (ink visit count). Lili: "Mama! Someone hid
  the good quilts!" / Dani: "We're a sandwich. I'm the filling!" / HU: Lili: „Anya! Valaki eldugta a
  jó dunyhákat!” / Dani: „Szendvics vagyunk. Én vagyok a töltelék!”
- A floor never blocks: morning always comes and the leave choice is offered as usual.
  `cabin_days` +1 each night.
- **Order of the night in the ink (#13).** The opening line (`night_cost` on the first night),
  the meal, the children's line by `hope`, the rose hips exchange (`night.rose_hips`, once, when
  forage was picked and the patch is undone), patch undone, fire undone, the dog line by `dog`, the
  night line by `warmth`, then `cabin_days` +1.
  - Children, `hope` ≤ 2 (quiet, with comfort in the same scene): "The children eat without a
    word." / Mira: "Tomorrow we make this place ours, one corner at a time." / "Lili leans on her
    shoulder. Dani holds on to her sleeve." / HU: „A gyerekek szó nélkül esznek.” / Mira: „Holnap
    belakjuk ezt a helyet, sarokról sarokra.” / „Lili a vállára hajtja a fejét. Dani a ruhaujjába
    kapaszkodik.” `hope` ≥ 3 (chatty): Dani: "Tomorrow I'm counting every spider in this house." /
    Lili: "Then you'll be up all week." / HU: Dani: „Holnap megszámolom az összes pókot a házban.” /
    Lili: „Akkor egész héten fent leszel.”
  - Dog: "ours": "Patch sleeps across the doorway, his nose on Dani's boot." / „Foltos keresztben
    alszik az ajtó előtt, orrát Dani csizmáján pihenteti.” "none": "Under the woodshed, the thin dog
    sighs in his sleep. Dani whispers goodnight to him." / „A fáskamra alatt nagyot sóhajt álmában a
    sovány kutya. Dani jó éjszakát suttog neki.”
- **End of part a (#13).** After the first night, `morning` shows one line and the story ends:
  "Morning comes softly to the lodge. Outside, the snow lies blue and still." / „Csendesen virrad a
  vadászlakban. Odakint kéken, mozdulatlanul fekszik a hó.” #34 replaces the END with the rest of the
  morning.

### 6. The leave choice (mornings after day 2 and day 3)

- a) "We go on to the manor on the map." / „Továbbmegyünk a térképen jelölt kúriához.”
- b) "One more day here." / „Még egy napot maradunk.” One more slot, one more meal, the kindling
  step and `warmth` -1 for each task still undone. One more day is never strictly better than going
  on, and going on is never strictly better than staying.
- On the morning after day 4 they go: the woodbox is empty, and a lodge is no place for a whole
  winter. This is a reason in the story, not a timer.
- The kindling: what is left of the woodbox goes with them. After day 2: a full sack of dry
  kindling (the first manor fire gets `warmth` +1 and the easiest start). After day 3: a little
  kindling (an easier start only). After day 4: none. Phase 1 reads it ("There is no kindling left
  from the lodge. This fire starts the hard way." / „A vadászlakból nem maradt gyújtós. Ez a tűz
  nehezen gyullad be.”).

### 7. The gate at dusk (`manor_gate`): last M1 beat

- `cabin_days`: 2 "Still tired, they climb the hill." / „Még fáradtan kapaszkodnak fel a dombra.”; 3
  "They climb the hill at a steady pace." / „Egyenletes léptekkel kapaszkodnak fel a dombra.”; 4
  "Rested, they almost race each other up the hill." / „Kipihenten szinte versenyt futnak fel a
  dombra.”
- The lodge map always matches the gate. If `trunk`: Lili holds up the luggage tag: "Lark Hill.
  Mama, we were coming here?" / Lili felmutatja a csomagcímkét: „Pacsirtadomb. Anya, mi ide
  tartottunk?”
- If `dog` = "ours": "Patch runs ahead and sits by the gate, as if he has always lived here." /
  „Foltos előreszalad, és leül a kapu mellé, mintha mindig is itt lakott volna.” If "none": "Behind
  them, two eyes shine in the bushes. One of them sits in a dark patch." / „Mögöttük két szem
  világít a bokrok közt. Az egyik egy sötét foltban ül.”
- Reaching the gate at `warmth` 0 is allowed; phase 1 reads it. End of M1.

### Choices in phase 0 and who reads them

| Choice                | Writes                                                                        | Read later by                                                                                      |
| --------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P0-1 stay or explore  | `camp`, `trunk`, `food`, `memory`, `warmth`, `hope`, `trust`                  | Day 1 slots, slot menu, patch input, cabin nights, gate line, phase 1 morning, epilogue (`memory`) |
| Slot picks            | `mg_fire`, `mg_patch`, `trunk`, `food`, `memory`, `trust`, `hope`, `dog_care` | Cabin nights, gate, phase 1 morning, phase 2 root cellar (`dog_care`), epilogue (`memory`)         |
| First dog chance      | `dog`, `dog_care`, `food` or `hope`                                           | Gate image, second chance (phase 1), every dog scene to the closing picture                        |
| Leave or one more day | `cabin_days` (and the costs of the extra day)                                 | Gate line, kindling at the first manor fire (phase 1)                                              |

Choices whose state only a later phase reads: the leave choice (the kindling, phase 1), the loft and
the trunk (`memory`, epilogue), the first dog chance (phases 1 to 5).

## Minigame hooks

Two minigames exist in the outline. Each hook names its inputs, the three bands and a different
continuation per band. A poor band always continues the story. There is no skip and no dismiss
(owner, round 3): the player plays the round, and every round ends on its own with a band (a fixed
length or end condition, so no player is stuck in a round). The only state that is not a band is
"not chosen" (a cabin task left undone, `mg_fire` or `mg_patch` = ""), which is a slot choice, never a
skip. Timing numbers belong to the minigame issues.

### Fire (`# minigame: fire`)

- Inputs: the fuel and the start. Lodge: dry wood from the woodbox, an easy start. First manor
  night: `night_room` (kitchen: small stove, easier; hall: big draughty fireplace, harder), `burned`
  ("nothing": damp branches, the hardest start) and the kindling from `cabin_days`. Phase 4 (played as
  Lili): the woodshed store.
- Lodge bands:
  - good: `warmth` +3, `hope` +1. "The stove catches at once and purrs like a small, happy bear." /
    „A kályha azonnal lángra kap, és úgy dorombol, mint egy kis, elégedett medve.”
  - fair: `warmth` +2, `trust` +1. "The fire holds, but only if someone feeds it." Lili: "I'll do it.
    You sit." / „A tűz kitart, de csak ha valaki eteti.” Lili: „Majd én. Te ülj le.”
  - poor: `warmth` +0, `hope` +1. "Smoke fills the room. Mira comes out with a sooty face, and Lili
    laughs until she hiccups." / „Füst tölti meg a szobát. Mira kormos arccal bukkan elő, Lili
    pedig addig nevet, amíg csuklani nem kezd.”
- First manor night: good `warmth` +3, `hope` +1 (hot soup, a story by the flames); fair `warmth` +2
  (Mira stays up feeding it; next morning Lili makes the tea: `trust` +1, written once); poor `warmth`
  +0, `hope` +1 (lukewarm soup and bread, one heap of coats, Dani's cold feet get a name).
- Phase 4, played as Lili: good `warmth` +2, fair +1, poor +0, and `dog_care` +1 if Patch is theirs (she
  feeds him while she minds the stove).
- In total points poor (1) < fair (3) < good (4), so poor never beats fair. Poor gives a small
  comfort (`hope` +1), never a reward.

### Patch (`# minigame: patch`)

- Inputs: the target and the material. Lodge: the roof hole, with the cart tarp if `trunk`, otherwise
  pine boughs and moss (harder). Phase 2 first repair: the roof hole (`night_room` = "hall") or the
  window (`night_room` = "kitchen"). Phase 3: the chimney.
- Lodge bands:
  - good: `warmth` +2, `hope` +1. "The patch holds tight. Not a single snowflake gets in." / „A folt
    szorosan tart. Egyetlen hópehely sem jut be.”
  - fair: `warmth` +1, `trust` +1. "The patch sags a little. Mira and Lili hold it up together until
    it sets." / „A folt kicsit megereszkedik. Mira és Lili együtt tartják, amíg meg nem köt.”
  - poor: `warmth` +0, `hope` +1. "The patch sags and drips. Dani names the drip Gerald." / „A folt
    megereszkedik és csöpög. Dani elnevezi a csöpögést Gézának.”
- Manor repairs: phase 2 first repair `manor` +1 / +2 / +3 for poor / fair / good, and `warmth` +1;
  phase 3 chimney `manor` +1 / +2 / +3. Each band has its own line (poor: it holds, crooked and
  proud; fair: it holds; good: it looks as if it was always there).

## Minigame and choice contract (story side)

- **Trigger point.** The `# minigame: <id>` tag is the last line of its beat. The one or two lead-in
  lines just before it read naturally when shown again (no "at last", "again" or "this time"). No
  variable is written between the tag and the band read; the band branch follows right after the
  tag.
- **Leaving during a minigame (AC 11a).** If the player force-closes the app or leaves the website
  during a minigame, the game continues at the trigger point when they come back: the story
  position just before the minigame starts, with the same inputs, and the round starts again.
  Nothing from the unfinished round is kept, and no penalty, message or guilt line follows. This is
  a restart, not a retry: in Normal the first completed round still counts as the one result.
  Once-only stitches (such as `cabin_cold`) count from the saved state, so a resume never plays them
  twice. No story line mentions leaving, resuming or retrying. The save checkpoint is a follow-up
  issue.
- **Which band is written.** The game writes the band of the round the player accepts, which is the
  last round played (in Normal, the only one). Nothing is written before the player accepts.
- **Ending a round.** After a band is shown, an Easy player picks "retry" or "continue"; a Normal
  player has "continue" only. "Continue" accepts the shown band and is not a skip, because the round
  was played to its end first; it is never offered before the round ends.
- **Settings during a round.** Opening settings does not pause-penalise, restart or change the
  running round; a mode change applies from the next minigame. If settings cannot be opened
  mid-round, the same rule holds.
- **Choices (AC 11b).** A story choice cannot be skipped, dismissed or auto-picked, and it never
  expires: no timer, no default after waiting, no "skip" or "decide later" option. A player who
  leaves the app on a choice comes back to the same choice.

## Viewpoint

Mira is the default viewpoint (owner Q14): choices are her words and deeds, and the children speak
to her. In a few short scenes the player acts as a child. Child scenes are short, in daylight or
indoors, never alone outdoors at night, never in danger, and never a separate storyline: each one
returns to Mira in the same beat. Their choices write only `hope`, `trust`, `memory` or `dog_care` (Lili's
phase 4 fire band also writes `warmth`). The switch is marked with `# pov: <id>` (proposed).

| Phase  | Scene                                                        | Viewpoint id |
| ------ | ------------------------------------------------------------ | ------------ |
| 0      | Explore the loft (the guest book)                            | `lili`       |
| 0      | Rest and play (with Patch, if he is theirs)                  | `dani`       |
| 2      | Dani's afternoon (a bed for Patch or a snow fort)            | `dani`       |
| 2      | The errand in the Millbrook shop (Mira across the street)    | `lili`       |
| 2 to 4 | "Make it right" b): Patch is the children's job this week    | `dani`       |
| 3      | The children's gift for Mira (with Dani)                     | `lili`       |
| 4      | Keeping house while Mira sits with Dani (`# minigame: fire`) | `lili`       |

Children call Mira "Mama" (EN) and „Anya” (HU).

## The dog

Owner Q8 b, FP1 a, FP2, FN5; D23.

- Adoption is optional. `dog` is "none" or "ours"; there is no "left". "None" is a full story with its
  own lines.
- Two chances: the first is the lodge's first evening (M1, Dani's crust, see Phase 0 beat 4). The
  second and last is the Lark Hill courtyard on the first morning of phase 1 (M2): Patch has followed
  them all the way. a) "Open the gate for him." / „Kinyitni neki a kaput.” `food` -1 (food cost rule),
  `dog` = "ours", `dog_care` = 3. b) "Not now." / „Most még nem.” `hope` -1. Dani: "He followed us all
  the way." / Mira: "He knows the way back, too. He's a clever dog." / Lili: "He's not leaving.
  He's just thinking it over." / HU: Dani: „Végig követett minket.” / Mira: „Visszafelé is tudja az
  utat. Okos kutya.” / Lili: „Nem megy el. Csak gondolkodik.” He trots back towards the wood. After
  this there is no further chance; in the epilogue a stray at the mill wags at them.
- M1 owns the first chance and the gate image; M2 owns the second chance.
- `dog_care` (0 to 10) writes only rewards for care: each reader adds a bonus on top of a neutral
  baseline (root cellar `food` +2 at ≥ 7; Patch by the bed `hope` +1 at ≥ 5; the storm bark at ≥ 7,
  where the baseline is `manor` -2 and a well Patch makes it -1). No low `dog_care` branch writes a
  loss to a main variable. There is no decay over time and no timer.
- Neglect only changes scenes (FP2). At `dog_care` ≤ 2, Patch is thin and quiet, shown gently, and in
  the same scene Mira notices and gets the "make it right" choice. The thin-and-quiet scene writes
  nothing:
  - "Patch lies by the door today, his nose on his paws. His coat looks thin." / Lili: "Mama, Patch
    is very quiet." / Mira: "I see it too. Let's all look after him a bit more." / HU: „Foltos ma az
    ajtó mellett fekszik, orrát a mancsán pihenteti. A bundája vékonynak tűnik.” / Lili: „Anya,
    Foltos nagyon csendes.” / Mira: „Én is látom. Vigyázzunk rá egy kicsit jobban, mindannyian.”
  - "Make it right": a) "Share supper with him, and give him the spot by the stove." / „Kapjon a
    vacsorából, és övé legyen a hely a kályha mellett.” (`food` -1, `dog_care` +3); b) "Make him the
    children's job this week." / „Ezen a héten ő legyen a gyerekek dolga.” (played as the children,
    `dog_care` +2). After both: "Patch thumps his tail on the floor." / Dani: "He's smiling. Dogs smile
    with their tails." / „Foltos a farkával dobol a padlón.” / Dani: „Mosolyog. A kutyák a farkukkal
    mosolyognak.”
- Patch never dies, is never hurt, never leaves, is never lost and never blocks the story. He is
  never shown hungry, starving, hurt, lost or left behind: when the family eats first, Patch is shown
  content ("Patch gets the pot to lick. He licks it until it shines." / Dani: "Look, he's doing the
  washing-up!" / „Foltos megkapja kinyalni a fazekat. Addig nyalja, amíg csillog.” / Dani: „Nézd, ő
  mosogat!”). There is no guilt prompt, and refusing him is never punished in words.

## Game modes (story side)

Owner Q12 and round 3; D21.

- **Easy:** unlimited retries and more forgiving timing. **Normal:** no retry and the base timing.
- The player picks the mode on the start screen of a new game, before the story (a UI element, not
  a story choice), and can change it at any time in the settings. A change applies from the next
  minigame that starts, never in the middle of a round. There is no lock.
- Ink never reads the mode. `game_mode` is a game setting stored with the save and read by the
  minigame runner; the story receives only the final band. Story text, choices and band effects are
  identical in both modes. Switching Easy to Normal or back changes nothing already written to ink
  variables and never rewinds the story.
- No story line mentions the mode, a retry or a switch. The mode is never tied to payment, never an
  ad reward and never nagged, and the game never suggests a mode switch after a poor result.
- UI strings live under `mode.*` in a follow-up issue (start-screen pick, settings selector, the
  "applies from the next minigame" note), EN and HU.

## Intro storyboard

Owner FP1 a: an animation if possible. Tag `# cutscene: intro_crash` (proposed, not promised). The
fallback narration is in the ink either way; if the animation exists it replaces the lines, if not
the lines carry the intro. Maximum 45 seconds. Fallback for the art: a still-image sequence with
simple motion (pan, fade, shake) within the 45 seconds.

| Beat | Picture                                                                                | Fallback narration EN                                                               | Fallback narration HU                                                      |
| ---- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | A horse cart on a snowy road through the wood, the family under the tarp               | Snow falls on a narrow road through the wood. A horse cart creaks along.            | Hó hull a keskeny erdei útra. Egy lovas szekér nyikorog előre.             |
| 2    | The wheel hits a rock under the snow; a cartoon tumble, cut to white before the impact | A rock waits under the snow. The cart tips, and everything goes white.              | A hó alatt egy szikla lapul. A szekér felborul, és minden elfehéredik.     |
| 3    | The carter on his feet; wolves as rubber-hose silhouettes far between the trees        | Far off, between the trees, wolves howl. The carter freezes.                        | Messze, a fák között farkasok üvöltenek. A kocsis megdermed.               |
| 4    | He unties the horse and rides away; the pack runs after him, off-screen                | He unties the horse and rides away. The pack runs after him, and the howling fades. | Kifogja a lovat, és elvágtat. A falka utána iramodik, az üvöltés elhalkul. |
| 5    | Mira opens her eyes in the snow, the children beside her, stars and a bump             | Mira opens her eyes. Lili. Dani. She knows their names. She knows nothing else.     | Mira kinyitja a szemét. Lili. Dani. Tudja a nevüket. Mást semmit.          |

12+ limits: no blood, no injury shown, no child lying unconscious on screen, the wolves only at a
distance and never attacking anyone, and the camera never follows the horse, the carter or the pack.

## Miss Agnes, old John and the lodge

- **Miss Agnes (FN2 b, FN6 a).** Before the crash, Miss Agnes had hired Mira as Lark Hill's
  caretaker at one meeting in town, and the cart was taking the family there. She told Mira to go
  up in January and start, and said she would come at the thaw, once the roads open. She is elderly
  and lives in town; no post goes up to Lark Hill in winter, and she has no reason to worry. She is
  never seen and never writes before the thaw. At the thaw she arrives, recognises Mira and sees how
  the house was kept. She is not a threat: the endings are about what the family built, not about
  permission. She appears in all four endings (see Endings).
- **Old John (FN3 a).** A Millbrook carter who outran the wolves; he and the horse got home unhurt,
  and the pack lost interest at the river. He says so once, in his own words. That night he reached
  Millbrook, shaking, and raised the alarm at the inn. The first big snow closed the cart road that
  same night (the footpaths on the lodge map stayed passable). When the men got through to the cart
  days later, it was empty and snowed over, with no tracks. There is no stationmaster at the halt in
  winter, so Millbrook believed the family had walked back and taken the train home. Nobody thought
  of the old lodge (unused for twenty years) or of Lark Hill (a ruin nobody lives in in winter).
  Only old John did not quite believe it, and that is his shame: he ran, and then he couldn't find
  them. In phase 2 Millbrook sends Mira to him when she asks about a cart in the wood. He tells them
  they were searched for, where he picked them up (the railway halt) and where they asked to go
  (Lark Hill). He does not know why. Meeting him gives `memory` +1. Choice: a) forgive him: `village`
  +1, `carter_forgiven` = true; b) keep a distance: `trust` +1 (Lili sees Mira stand firm). Read in phase
  4 (forgiven: he brings a cartload of firewood after the storm, `warmth` +2; otherwise the village
  helps without him) and in the epilogue. He is never hurt and never meets the wolves again on
  screen.
- **What Millbrook knows.** Miss Agnes hired Mira in town and told nobody in the village; the cart
  was booked at the halt and old John only heard "Lark Hill". On the first trip Millbrook says:
  "Lark Hill? Nobody's lived there in twenty years." / „Pacsirtadomb? Ott húsz éve nem lakik senki.”
  and "Old John's passengers went back to the train, they say." / „Azt mondják, János utasai
  visszamentek a vonathoz.” The next clue is phase 3 gossip at the shop and post office: "Old Miss
  Agnes, the last of the Lark Hill family, was looking for a caretaker last autumn. My sister saw
  the notice in the town paper. Nobody came, of course." / „Ágnes néni, a pacsirtadombi család
  utolsó tagja, ősszel gondnokot keresett. A húgom látta a hirdetést a városi újságban. Persze
  senki sem jelentkezett.” The family starts to guess; nobody confirms it until Miss Agnes does at
  the thaw. Everybody tells what they know, and nobody keeps the answer back.
- **The lodge (FN4 b).** The cabin is Lark Hill's old hunting lodge. A lark is carved over the door.
  An old estate map on the wall shows the lodge, the valley path and the manor two hours away, which
  is how the family knows where to go, with or without the trunk. In the loft, the guest book's last
  entry, years old, is in Miss Agnes's own hand. The lodge has no variable of its own. What the
  family can read (#13): the map has no legible name (the lodge with a small lark, the valley path, a
  big house two hours' walk away, the lettering faded); the guest book's last entry is a short
  thank-you signed only "A." (HU „Á.”), naming neither Lark Hill, a caretaker nor the family. The
  family does not know whose lodge it is; the carved lark on the door and on the map is the only
  link, never stated, and the narration says "the lodge" / „a vadászlak”. Before the gate, "Lark
  Hill" appears only on Stay's luggage tag, so the name on the gate stays the reveal.
- **How the memory thread ends (FN1 b).** See Memory: the old life never fully returns; facts from
  outside and fragments from inside meet at the thaw, and `memory` sets how much they know.
- **The father (owner Q17 c).** There is no father thread. The question is never asked, and nobody
  deflects it. Dani's bedtime question is about a house ("Mama, did we have a house before?"), and
  Mira's answer stays with the three of them. Adults speak of the family only as "Mira and her
  children": old John's "a mother and two little ones", Millbrook's "the caretaker and her two",
  Miss Agnes's "you and the children". Nobody says widow, husband, father or Papa, and nobody
  guesses. No fragment points to a father; Mira's `memory` 4 to 5 gives her her own childhood farm,
  not a former married life.

## Phases 1 to 5 outline (M2 and later)

Outline only; each phase gets its own story issue. Writers and readers are final for the model
above.

### Phase 1: first night at Lark Hill (`manor_gate`, `manor_hall`, `manor_kitchen`, `manor_library`, `courtyard`)

1. Arrival at dusk. The house: broken windows, a door that still opens. Reads `warmth` at 0 ("one heap
   under every coat" tonight).
2. The hall, choice 1, what Mira tells them: a) "We'll make this place our home." / „Ebből otthont
   csinálunk.” `hope` +2, `promised_home` = true. b) "It isn't ours. We stay until we find out who we
   are." / „Ez nem a miénk. Addig maradunk, amíg ki nem derül, kik vagyunk.” `trust` +2.
3. Where to sleep, choice 2: a) the kitchen, `warmth` +1, an easier fire; b) the hall, under the stars
   in the roof, `hope` +1, a harder fire, and the roof hole is the first repair. Writes `night_room`.
4. Fuel, choice 3: a) the library's mouldy books, `warmth` +1; b) the broken chairs in the hall,
   `warmth` +1; c) damp branches from the garden, `warmth` +0 and the hardest start, but nothing is
   lost. Writes `burned`.
5. The fire (`# minigame: fire`), with the kindling from the lodge. Supper is warmed on it.
6. Supper, choice 4: a) "A proper supper together tonight." `food` -1, `hope` +1, `dog_care` +1 if Patch is
   theirs; b) "Keep half for the morning." Nothing now; breakfast tomorrow.
7. Bedtime, as Mira. Dani: "Mama, did we have a house before?" If `burned` is not "books", she reads
   from a library book (`hope` +1). If it is "books", she makes up a story and a piece of her past
   slips out, a farm and a red cow (`memory` +1).
8. Morning (`courtyard`, then the base room). The second dog chance comes first, if `dog` = "none".
   Reads `warmth` (≤ 3: one heap under every coat; 4 to 5: Mira is tired; ≥ 6: a warm morning),
   `trust` (≥ 7: Lili asks "Are we staying?" straight out; below 7 she keeps the worry to herself),
   `food` (≥ 1: breakfast from what they kept), `mg_fire` ("fair": Lili makes the tea, `trust` +1) and
   `dog`.

### Phase 2: settling in

- Dani's afternoon (as Dani): a) a bed for Patch by the stove, `dog_care` +1 (offered only if Patch is
  theirs); b) a snow fort with Lili, `hope` +1. Without Patch the snow fort is the scene, not a choice.
- First repair (`# minigame: patch`, target from `night_room`).
- The Millbrook trip (`millbrook_square`): `village` +1, `food` +2. At `trust` ≥ 6 Lili does the errand in the
  shop (`village` +1); otherwise Lili and Dani sort the library at home (`hope` +1).
- The butcher's bone (only if Patch is theirs): a) into the soup, `food` +1, `dog_care` -1 (Patch gets
  the pot to lick); b) for Patch, `dog_care` +2.
- The root cellar (`root_cellar`): a well Patch (`dog_care` ≥ 7) digs it out, `food` +2.
- Old John: `memory` +1, then forgive him or keep a distance (see above).
- Second repair: a) the roof of the base room, `manor` +2, `warmth` +1; b) the henhouse with two hens
  from Millbrook (`courtyard`), `manor` +1, `food` +1; c) a day's work at the mill (`millbrook_mill`),
  `village` +2.
- "Make it right" if `dog_care` ≤ 2.

### Phase 3: midwinter feast

- The promise beat, only if `promised_home`: at `manor` ≤ 3 Lili asks, out of curiosity: "Was it true,
  what you said the first night?" a) "I hoped so, and I still do." `trust` +1, `hope` -1; b) "Of course
  it's true." `hope` +1, `trust` -2. Comfort follows in the same scene. At `manor` ≥ 4 the promise looks
  kept: `trust` +1.
- The chimney (`# minigame: patch`).
- The feast (`manor_hall`): a) invite Millbrook, `village` +2, `food` -1, and Patch spends the evening with a
  bone in the woodshed because the guests' little ones are shy of dogs (`dog_care` -1); b) just the
  family, `hope` +1.
- The feast story: a) read from a library book (only if `burned` is not "books"), `hope` +1; b) tell
  one from memory, `memory` +1.
- The children's gift (as Lili, with Dani): a) they write down Dani's half-song, `memory` +1, `hope`
  +1; b) paper lanterns for the hall, `hope` +2.
- The gossip about Miss Agnes's notice (`millbrook_shop`).
- "Make it right" if `dog_care` ≤ 2.

### Phase 4: the long cold

- The opening reads `warmth`. At ≤ 3 Dani has a fever for 2 or 3 scenes; at ≥ 4 only a sniffle line.
  Recovery is certain in every case. Variables change only who helps: Millbrook comes at `village` ≥ 3
  (`hope` +1); otherwise Mira's hands remember a lime-blossom tea (`memory` +1). Patch lies by the bed
  if he is theirs and `dog_care` ≥ 5 (`hope` +1). Mira: "February does this to little ones. You'll be
  right as rain soon, you'll see." / „A február már csak ilyen a kicsikkel. Hamar rendbe jössz,
  meglátod.”
- Lili keeps house while Mira sits with Dani (`# minigame: fire` as Lili), fever or sniffle.
- The storm: `manor` -2 (-1 if a well Patch barks before it, `dog_care` ≥ 7), `warmth` -1.
- Old John's firewood if `carter_forgiven`: `warmth` +2.
- After the storm: a) the roof (`manor_roof`), `manor` +2; b) help Millbrook with their damage,
  `village` +2, and they come up the next day and help in return, `manor` +1.
- The last sack (only if Patch is theirs): a) the family eats first, `food` +1, `dog_care` -2 (Patch is
  shown content); b) share it with Patch, `dog_care` +1.
- "Make it right" if `dog_care` ≤ 2.

### Phase 5: thaw

Miss Agnes arrives. The ending check (first match wins), the ending scene, the epilogue lines and
the closing picture (see Timeline and endings).

## Tags

Tag form is `# key: value`; values are lowercase English ids, identical in story/en and story/hu.
`scene` and `minigame` are supported by the game (docs/architecture.md). Every other tag is proposed,
not promised: the story may carry it, the game ignores it until an issue adds it. New tags are added
only through this file.

| Tag                | Values                                                  | Status                 | Meaning for the game                                                                      |
| ------------------ | ------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `# scene: <id>`    | The values in Places and scene values                   | Supported              | The background to show from this line on                                                  |
| `# minigame: <id>` | `fire`, `patch`                                         | Supported              | Start this minigame at its trigger point; the game writes `mg_<id>` with the band         |
| `# target: <id>`   | `roof_hole`, `window`, `chimney`                        | Proposed, not promised | Patch input where no variable carries it; the minigame issue settles the form             |
| `# tutorial: <id>` | `slot_costs`, `band_result`, `night_cost`, `leave_cost` | Proposed, not promised | Show this tutorial hint (UI string); only inside the lodge tutorial                       |
| `# pov: <id>`      | `mira`, `lili`, `dani`                                  | Proposed, not promised | Whose turn it is from this line on; the UI shows it                                       |
| `# speaker: <id>`  | `mira`, `lili`, `dani`, `dog`, `carter`, `heir`         | Proposed, not promised | Who says this line; narration has no speaker tag. Ids are role-based and never translated |
| `# cutscene: <id>` | `intro_crash`                                           | Proposed, not promised | Play this cutscene; the fallback narration lines follow in the ink                        |
| `# chapter: <id>`  | `wood`, `first_night`, ...                              | Proposed, inert (P3 a) | Chapter card and save point at a chapter start                                            |
| `# time: <id>`     | `dusk`, `night`, `dawn`, `day`                          | Proposed, inert (P3 a) | Lighting of the background                                                                |
| `# mood: <id>`     | `warm`, `hopeful`, `tense`, `sad`, `funny`, `calm`      | Proposed, inert (P3 a) | Music and light hint                                                                      |

No tag ever shows story text to the player; the tutorial hints are UI strings with t() keys.

## Honesty check

docs/vision.md, Honesty rules (non-negotiable), quoted:

> - No match-3, no fake-ad gameplay, no misleading store pages or marketing.
> - No energy timers, no waiting to play, no paywalled story progress, no loot boxes.
> - No fake urgency, guilt prompts or "the children will freeze unless you pay".
> - A minigame never blocks the story: a poor result leads to a different story, not a wall.
> - Monetization, if any, is decided by the owner and stays fair (for example a premium price or a
>   one-time unlock after a free first chapter). Agents never add monetization on their own.

This file names the following only as prohibited. The narrative-designer self-checks every story
pull request against the whole list; the named checker reads every beat, tag, variable and choice
of the pull request (no text search).

| #   | Never                                                                                                                                                     | Checker               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1   | A pay prompt, paywalled story progress, an energy or wait timer, a loot box, a countdown or fake urgency, match-3, fake-ad gameplay, misleading marketing | code-reviewer         |
| 2   | A game over: a poor result or a floor value continues the story, differently                                                                              | requirements-reviewer |
| 3   | A guilt prompt; the dog dying, leaving or blocking the story                                                                                              | requirements-reviewer |
| 4   | A blame line (definition below)                                                                                                                           | requirements-reviewer |
| 5   | A cost hint after the lodge tutorial                                                                                                                      | requirements-reviewer |
| 6   | A skip or dismiss for a minigame or a choice, or a timer on a choice                                                                                      | code-reviewer         |
| 7   | A mode nag, a mode tied to payment or an ad, or a "switch to Easy?" prompt after a poor result                                                            | code-reviewer         |
| 8   | A mode lock: the player may change the mode at any time                                                                                                   | code-reviewer         |
| 9   | A penalty, message or guilt line on return after the app was closed mid-minigame                                                                          | code-reviewer         |

**Blame, one definition (AC 17).** A blame line accuses or scolds the player ("you should have...",
"you let them down"), or presses them to undo a result ("fix it now"). A consequence line states
what happened in the story ("the fire had died by morning", "Dani did not speak at supper") and is
allowed and wanted, negative included, because choices must matter. Test: a consequence line is true
of the story world and carries no command or accusation toward the player. Mira is the player
(Q14), so a line where Mira blames herself, or a child accuses Mira, blames the player and fails the
test. Phrases that usually fail it, as examples only: "because you", "if only", "you should have",
"I should have", "if we had", and in Hungarian „miattad”, „bárcsak”, „kellett volna” in a blaming
sense. Not allowed: Lili: "We should have fixed the roof." / Mira: "This is my fault." Allowed: the
rose-hips line in Phase 0 beat 5.

Two limits go beyond the test and rest on owner answers (AC 17):

- **No illness line tied to a choice** (owner Q19 b). The fever has no cause in the text: no line ties
  it to an earlier choice, the cold rooms, the fire or anyone's care. It belongs to the season.
  Recovery is certain, and the fever starts only at the phase 4 opening at `warmth` 3 or less, a value
  built over many scenes, never by one click. Choices during it are about comfort, never about saving
  him.
- **Patch is never shown suffering** (FP2). A sad or hungry Patch is a calm scene, never pain, injury
  or distress.

The narrative rules behind the list (N1 to N7):

- **N1. No blame:** the definition above.
- **N2. Refusing Patch is never punished in words:** the cost is `hope` -1 because Dani is sad, and
  comfort follows in the same scene.
- **N3. Patch is never shown hungry, starving, hurt, lost or left behind** (see The dog).
- **N4. The fever has no cause in the text** (the first limit above).
- **N5. A child's sad line reaches the player.** A child may be sad to Mira about a feeling, and may
  name a consequence in the world ("The roof's still open, Mama. Can I have the middle?" / „Még
  mindig nyitva a tető, anya. Hadd aludjak középen!”), but never accuses anyone of a decision. The
  line never asks for something the player must buy, do or repeat, and comfort follows in the same
  scene. Sample: Dani: "I don't remember my old bed. I miss it anyway." / Mira: "Me too. Come here,
  we'll make this the warmest bed in the house. You're the hot-water bottle." / Dani: "I'm the
  hot-water bottle!" / HU: Dani: „Nem emlékszem a régi ágyamra. Mégis hiányzik.” / Mira: „Nekem
  is. Gyere, ebből csináljuk a ház legmelegebb ágyát. Te leszel a termofor.” / Dani: „Én vagyok a
  termofor!” No story line addresses the player outside the story.
- **N6. Costs are never time running out:** the `warmth` cost of an undone task names its cause in the
  world. No countdown, no "hurry", no line about time running out.
- **N7. Cost hints and choices:** no cost hint, cost note in choice text or number preview after the
  tutorial. Every choice waits for the player: no timer, no default pick, no "skip" or "decide
  later". No story line mentions the game mode, a retry, or leaving and resuming a minigame.

Residual risks and who reads for them: no skip in Normal could frustrate a struggling player
(mitigated by a mode change at any time and by every round ending on its own; code-reviewer); a
force-close restart can be used to try a Normal round again (the owner's choice; it costs the player
nothing they did not already have); the line between consequence and blame is a reading judgment
(narrative-designer writes, requirements-reviewer and code-reviewer read).

## Ink knot map

story/en/main.ink and story/hu/main.ink hold phase 0 from the crash to the first morning at the
lodge (#13, part a). One file per language, no INCLUDE; knots, stitches, variables, tags and choice
order are identical in both, only the text differs. #34 extends this map with the later days, the
leave choice and the gate.

| Knot or stitch                                        | Beat | What it does                                                                                                                                                                               |
| ----------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `intro`                                               | 0    | `# scene: wood_road` and `# cutscene: intro_crash` on the first fallback line, then the other four lines                                                                                   |
| `cart`, `cart.stay`, `cart.explore`                   | 1    | `# scene: cart_camp`, choice P0-1 and its writers; each branch ends on the footpath (`# scene: wood_path`)                                                                                 |
| `lodge`                                               | 2    | Reads `camp` (midday or dusk), `# scene: cabin`                                                                                                                                            |
| `day.first`                                           | 3    | `-> slot.menu(camp == "wood") ->`; for Stay a second `-> slot.menu(mg_fire == "" and mg_patch == "") ->`; then `dog_chance`. The pick count is the number of tunnel calls                  |
| `slot.menu(tasks_only)`                               | 3    | The prompt (the first time through `slot.costs_hint`), then sticky options with explicit conditions: fire and patch while their band is "", the others once each and not when `tasks_only` |
| `slot.costs_hint`                                     | 3    | The first prompt, with `# tutorial: slot_costs`                                                                                                                                            |
| `slot.fire`, `slot.patch`                             | 3    | The lead-in (writes nothing); the minigame tag ends its last line                                                                                                                          |
| `slot.fire_band`, `slot.patch_band`                   | 3    | The band switch with the lodge values, then `slot.band_hint` if not yet visited                                                                                                            |
| `slot.band_hint`                                      | 3    | "Mira brushes off her hands.", with `# tutorial: band_result`                                                                                                                              |
| `slot.forage`, `slot.loft`, `slot.rest_play`          | 3    | Their writers, with the scene and pov tags                                                                                                                                                 |
| `dog_chance`, `dog_chance.share`, `dog_chance.refuse` | 4    | The first dog chance                                                                                                                                                                       |
| `night`, `night.rose_hips`                            | 5    | The first cabin night, with `# tutorial: night_cost` on its opening line                                                                                                                   |
| `morning`                                             | 5    | One closing line, then END (#34 continues the morning)                                                                                                                                     |
| `function change(ref value, amount, top)`             | all  | The only writer of numbers: clamps to 0 to top (10; `memory` 5; `cabin_days` 4)                                                                                                            |
| `function food_cost()`                                | all  | The food cost rule                                                                                                                                                                         |

Writing rules for these files: numbers change only through `change()`; `mg_fire` and `mg_patch` are
written only by the game; a visit count is read only as visited or not; no sequences, cycles,
shuffles, `TURNS()`, `TURNS_SINCE()` or randomness; glue only at the end of a line; the minigame
tag ends the last lead-in line and the tutorial tags end a plain text line outside any choice or
conditional; every choice option stands alone (bracketed choice text, spoken choices in quotes,
menu items as noun phrases); dialogue carries the speaker's name in the text, and `# speaker:` is
not used.

## Follow-up issues

Named here, not built here; board-keeper creates them after #11 is merged:

- M1 story: phase 0 in ink (EN, then HU), replacing the placeholder.
- Start-screen mode pick and settings selector, with `mode.*` keys EN and HU.
- Minigame runner contract: retry in Easy only, the accepted (last) round's band is written,
  "continue" appears only after a band is shown, no skip.
- Save checkpoint at the minigame trigger point (changes the save format; ADR candidate there).
- Tutorial hint UI: the `# tutorial:` tag and the four keys.
- Scene display and the `scene` values.
- Intro scene player and art (still-image fallback).
- M1 art: the family, Patch, the M1 places.
- Fire and patch minigames (timing numbers for Easy and Normal there).
- A possible story-check extension: every `# scene:`, `# minigame:` and `# tutorial:` value and every
  `VAR` in story/ has a row in this file (tester and product-ba decide).

## Open questions

No owner question is open for this file. Open for later chapters, not for this winter: see Memory
(the town they came from, why Mira took the post, her childhood farm). Any new named character, a
change to an ending or a character's fate goes to the owner (CLAUDE.md escalation triggers).

## Change log

All answers recorded verbatim on issue #11; rows D19 to D25 in docs/decisions.md.

- 2026-11-26, round 1: Q1 a (two children, a girl of 11 and a boy of 6), Q2 c (Mira), Q3 a (Lili and
  Dani), Q4 a (Lark Hill / Pacsirtadomb, Millbrook / Malompatak), Q5 a (1930s-feel countryside), Q6
  (the cart crash, the memory loss, the carter and the wolves; an intro animation), Q7 b
  (bittersweet), Q8 b (a dog to adopt and keep safe and well), Q9 c (no outsider on the first night;
  the village enters in phase 2), Q10 b (four endings), Q11 (five phases plus phase 0 in the wood
  and the lodge), Q12 (fire or patch at the lodge; retries by game mode), Q14 (the player is the
  mother, sometimes the children), Q15 c (an absent heir), Q16 c (31, farm-raised), Q17 c (no father
  thread), Q18 b (winter palette with one warm accent each), Q19 b (moderate 12+: a fever with
  certain recovery), P1 (Mira), P3 a (`chapter`, `time`, `mood` stay proposed).
- 2026-11-26, round 2: FP1 a (M1 is phase 0 with the intro, game modes and an optional dog), FP2
  (two dog chances; neglect only changes scenes), FN1 b (only fragments and facts come back), FN2 b
  (the heir hired Mira as caretaker), FN3 a (old John, a Millbrook carter, met in phase 2), FN4 b
  (the lodge belongs to Lark Hill), FN5 (Patch / Foltos; old John / János, János bácsi).
- 2026-11-27, round 3: FN6 a (Miss Agnes / Ágnes, Ágnes néni), FN7 a (the looks of Patch, old John and
  Miss Agnes), the game mode can be changed at any time in the settings, no skip or dismiss for
  minigames and choices, leaving the app mid-minigame resumes at the trigger point, cost hints only
  in the tutorial, consequence lines allowed and blame lines not.
- 2026-11-27: this file written (narrative-designer, #11).
- 2026-11-27: phase 0 day 1 in ink (#13): "Placeholder story" replaced by the ink knot map; what
  the family can read at the lodge (the lodge, Memory); the night order, the closing line and the
  tutorial tag lines in Phase 0.
