// Helyőrző történet a folyamat kipróbálására. A narrative-designer lecseréli.
VAR warmth = 2
VAR hope = 1

-> night_one

=== night_one ===
A szél minden résen besüvít a régi falak között. Mira közelebb húzza magához a gyerekeket.
* [Elégetni a törött széket] -> burn_chair
* [Takarókat keresni a pincében] -> cellar

=== burn_chair ===
~ warmth = warmth + 2
Ropog a tűz. Ma éjjelre elég lesz.
-> morning

=== cellar ===
~ hope = hope + 1
A por alatt egy láda rejtőzik, benne egy paplan, amelyet valaki nagyon szeretett.
-> morning

=== morning ===
{ warmth > 2: A gyerekek átaludták az éjszakát. | Senki sem aludt sokat, de együtt vannak. }
-> END
