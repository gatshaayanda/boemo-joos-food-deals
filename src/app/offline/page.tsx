import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="orderPage">
      <div className="orderWrap">
        <div className="orderHeader">
          <Link href="/" className="logo"><span className="logoMark">B</span><span>BOEMO</span></Link>
        </div>
        <section className="orderCard confirm">
          <div className="confirmIcon">📶</div>
          <span className="kicker">Offline mode</span>
          <h1>BOEMO is still here.</h1>
          <p>The BOEMO app shell and previously loaded public pages can remain available on this device while your connection is away.</p>
          <p>Firestore can keep an eligible order write locally and synchronize it later, but the kitchen has not received an offline order until Firebase confirms synchronization.</p>
          <div className="actions centered">
            <Link className="button buttonPrimary" href="/order">Open Order</Link>
            <Link className="button buttonLight" href="/">Open BOEMO</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
