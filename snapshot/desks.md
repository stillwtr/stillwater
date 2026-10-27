# Desks

A desk is a set of keys that share one first funder. This note is the rule that cut those groups out of the list.

The first funder is the earliest ordinary ETH payment to that key, at or before the snapshot block. The lookup used the first page of those transfers, fifty rows. An internal payment older than that page was not seen. That key was treated as alone.

A key whose funder is a known exchange, bridge, or router is treated as alone. A key with no such payment is treated as alone. Keys that are alone stay on the list. Desks with fewer than 10 keys stay.

A desk is off the list when it has at least 10 keys and most of those first payments landed inside one 24-hour window.

One factory of 453 keys did not trip that one-day rule. Its busiest day was 20 keys, spread over 853 days. It was removed because it was named, not because of the one-day rule. Its funder never walked a hall, so the funder was not added.

A parent funder is added only when that parent walked a hall in the same year and has sent at least one transaction. A factory that never walked is not added.

These counts are the live list, after the LondonTokenBase clones were included. The hall stores this root. The path from the earlier 21,501 keys is in `snapshot/SNAPSHOT.md`.

- keys before: 21501
- farm desks before: 0
- groups before: 17378
- keys only on LondonTokenBase clones: 3746
- keys removed from the previous root: 11
- parents added: 0
- keys after: 25236
- groups after: 19975
- farm desks after: 0
- root: `0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3`

The leaf is `keccak256(bytes.concat(keccak256(abi.encode(address))))`.
