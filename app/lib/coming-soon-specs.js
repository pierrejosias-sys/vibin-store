// Spec files for the coming-soon pieces on /shop (see app/lib/coming-soon.mjs).
// A piece with no photo yet stays off /shop (comingSoonTiles leaves it out), so no tile shows blank.
import gasHoodie from '../../public/designs/top-gasoline-hoodie.json'
import mdTee from '../../public/designs/top-move-different-tee.json'
import windbreaker from '../../public/designs/top-windbreaker.json'
import firstLayer from '../../public/designs/top-first-layer-kit.json'
import kTote from '../../public/designs/kita-tote.json'
import kToteLime from '../../public/designs/kita-tote-lime.json'
import kTotePlum from '../../public/designs/kita-tote-plum.json'
import kToteBurgundy from '../../public/designs/kita-tote-burgundy.json'
import kToteAllBurgundy from '../../public/designs/kita-tote-all-burgundy.json'
import kToteBlack from '../../public/designs/kita-tote-black.json'
import kToteRoyalBlue from '../../public/designs/kita-tote-royal-blue.json'
import kToteChains from '../../public/designs/kita-tote-chains.json'
import kCreamKeychain from '../../public/designs/kita-cream-keychain.json'
import kInvertedBubbleKeychain from '../../public/designs/kita-inverted-bubble-keychain.json'
import kPlushBubbleKeychain from '../../public/designs/kita-plush-bubble-keychain.json'
import kLeatherBubbleKeychain from '../../public/designs/kita-leather-bubble-keychain.json'
import kStarKeychain from '../../public/designs/kita-star-keychain.json'
import kPinCharmGold from '../../public/designs/kita-pin-charm-gold.json'
import kPinCharmSilver from '../../public/designs/kita-pin-charm-silver.json'
import kPinCharmChocolate from '../../public/designs/kita-pin-charm-chocolate.json'
import kPinCharmGlam from '../../public/designs/kita-pin-charm-glam.json'
import kPinCharmCrystalTag from '../../public/designs/kita-pin-charm-crystal-tag.json'
import kPinCharmCrystal from '../../public/designs/kita-pin-charm-crystal.json'
import kMagneticCharms from '../../public/designs/kita-magnetic-charms.json'
import kLanyardChain from '../../public/designs/kita-lanyard-chain.json'
import kLanyardTether from '../../public/designs/kita-lanyard-tether.json'
import kLanyardSpring from '../../public/designs/kita-lanyard-spring.json'

// Kita's line, in her order: totes, keychains, charms, lanyards.
export const KITA_SPECS = [kTote, kToteLime, kTotePlum, kToteBurgundy, kToteAllBurgundy, kToteBlack, kToteRoyalBlue, kToteChains, kCreamKeychain, kInvertedBubbleKeychain, kPlushBubbleKeychain, kLeatherBubbleKeychain, kStarKeychain, kPinCharmGold, kPinCharmSilver, kPinCharmChocolate, kPinCharmGlam, kPinCharmCrystalTag, kPinCharmCrystal, kMagneticCharms, kLanyardChain, kLanyardTether, kLanyardSpring]

export const COMING_SOON_SPECS = [gasHoodie, mdTee, windbreaker, firstLayer, ...KITA_SPECS]
