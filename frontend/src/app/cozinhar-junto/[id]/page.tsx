"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { formatIngredientAmount } from "@/lib/format";
import { CookingRoomConnection, type CookingRoom, type ConnectionStatus } from "@/services/cooking-room-connection";
import { getRecipeBySlug } from "@/services/recipes.service";
import type { Recipe } from "@/types/recipe";

import styles from "./page.module.css";

function suggestedSeconds(instruction: string): number | null {
  const match = instruction.match(/(?:\b|^)(\d{1,3})\s*(segundos?|segs?|minutos?|mins?|horas?|hrs?)\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const seconds = unit.startsWith("seg") ? amount : unit.startsWith("min") ? amount * 60 : amount * 3600;
  return seconds >= 15 && seconds <= 10800 ? seconds : null;
}

function displayClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
}

function displayDuration(seconds: number): string {
  if (seconds < 60) return seconds + " s";
  if (seconds % 3600 === 0) return seconds / 3600 + " h";
  return Math.round(seconds / 60) + " min";
}

export default function CookingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<CookingRoom | null>(null);
  const [status, setStatus] = useState("Conectando...");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const connection = useRef<CookingRoomConnection | null>(null);

  useEffect(() => {
    if (!id) return;
    const client = new CookingRoomConnection(id, {
      onRoom: setRoom,
      onStatus: (state, message) => {
        setConnectionStatus(state);
        setStatus(message);
      },
    });
    connection.current = client;
    return () => {
      client.dispose();
      connection.current = null;
    };
  }, [id]);

  useEffect(() => {
    if (!room?.recipeSlug) return;
    const abort = new AbortController();
    // The synthetic rooms used by diagnostic tools do not have a catalogue recipe.
    if (room.recipeSlug.startsWith("ws-inspector")) return;
    getRecipeBySlug(room.recipeSlug, abort.signal)
      .then(setRecipe)
      .catch(() => { /* The cooking room remains fully usable without catalogue metadata. */ });
    return () => abort.abort();
  }, [room?.recipeSlug]);

  useEffect(() => {
    if (timerEnd === null) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setTimerSeconds(seconds);
      if (seconds === 0) setTimerEnd(null);
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [timerEnd]);

  useEffect(() => {
    // The invitation is also displayed as selectable text when Clipboard API is blocked.
    setShareUrl(window.location.href);
  }, [id]);

  const steps = room?.steps ?? [];
  const currentIndex = Math.min(selectedIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[currentIndex] ?? "";
  const finished = room?.completed.filter(Boolean).length ?? 0;
  const total = steps.length;
  const percentage = total ? Math.round((finished / total) * 100) : 0;
  const connected = connectionStatus === "connected";
  const allDone = total > 0 && finished === total;
  const suggestion = suggestedSeconds(currentStep);
  const timerRunning = timerEnd !== null;
  const invitation = shareUrl || "/cozinhar-junto/" + id;

  function toggle(index: number) {
    if (!room || !connected || index < 0 || index >= room.steps.length) return;
    // Never update the visual completion optimistically: the server is authoritative.
    connection.current?.setStep(index, !room.completed[index]);
  }

  function startTimer(seconds: number) {
    setTimerSeconds(seconds);
    setTimerEnd(Date.now() + seconds * 1000);
  }

  function pauseTimer() {
    setTimerEnd(null);
  }

  function resetTimer() {
    setTimerEnd(null);
    setTimerSeconds(0);
  }

  async function copyInvite() {
    setShareOpen(true);
    setCopied(false);
    setShareError(false);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard indisponível");
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setShareError(true);
    }
  }

  return (
    <main className={"container page-shell " + styles.page}>
      <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
        <Link href="/receitas">Receitas</Link><span aria-hidden="true">/</span>
        <span>Cozinhar junto</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <span className={styles.eyebrow}><span aria-hidden="true">✳</span> COZINHA COMPARTILHADA</span>
          <span className={styles.heroMeta}>Feito para preparar em boa companhia</span>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <p className={styles.heroOverline}>TÁ TODO MUNDO CONVIDADO</p>
            <h1>{room?.title ?? "Cozinhar junto"}</h1>
            <p className={styles.heroDescription}>Uma receita, várias mãos. Acompanhem as etapas e celebrem cada conquista juntos, em tempo real.</p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.shareButton} onClick={() => void copyInvite()}>
                <span aria-hidden="true">↗</span> {copied ? "Convite copiado!" : "Convidar alguém"}
              </button>
              {room ? <Link className={styles.recipeButton} href={"/receitas/" + room.recipeSlug}>Ver receita completa <span aria-hidden="true">↗</span></Link> : null}
            </div>
          </div>
          <div className={styles.heroBadge} aria-hidden="true">
            <span className={styles.heroBadgeRing}><span>🍳</span></span>
            <span className={styles.heroBadgeCaption}>BORA COZINHAR!</span>
          </div>
        </div>
        <div className={styles.heroFooter}>
          <div className={styles.presence}>
            <div className={styles.avatars} aria-hidden="true">
              <span className={styles.avatarA}>✳</span>
              <span className={styles.avatarB}>✦</span>
              {room && room.onlineCount > 2 ? <span className={styles.avatarExtra}>+{room.onlineCount - 2}</span> : null}
            </div>
            <p className={styles.presenceLabel}>
              {room && connected ? <><strong>{room.onlineCount} participante(s) online</strong><small>na mesma cozinha, em tempo real</small></> : <><strong>Aguardando conexão</strong><small>você poderá convidar alguém em breve</small></>}
            </p>
          </div>
          <p role="status" aria-live="polite" className={styles.status} data-state={connectionStatus}>
            <span className={styles.statusDot} aria-hidden="true" />
            {status}{room && connected ? " · " + room.onlineCount + " participante(s) online" : ""}
          </p>
        </div>
      </header>

      {shareOpen ? (
        <section className={styles.sharePanel} aria-labelledby="invite-title">
          <div>
            <p className={styles.sectionEyebrow}>CONVITE DA COZINHA</p>
            <h2 id="invite-title">Traga mais alguém para a receita</h2>
            <p>Quem abrir este link participa da mesma sala e pode marcar etapas com você.</p>
          </div>
          <div className={styles.inviteField}>
            <label htmlFor="invite-url">Link do convite</label>
            <input id="invite-url" type="text" readOnly value={invitation} onFocus={(event) => event.currentTarget.select()} />
            <button type="button" onClick={() => void copyInvite()}>{copied ? "Copiado ✓" : "Copiar"}</button>
          </div>
          {shareError ? <p role="alert" className={styles.shareNote}>Não foi possível copiar automaticamente. Selecione e copie o link acima.</p> : null}
          <button type="button" className={styles.closeShare} onClick={() => setShareOpen(false)} aria-label="Fechar convite">×</button>
        </section>
      ) : null}

      {connectionStatus === "offline" || connectionStatus === "unavailable" || connectionStatus === "retrying" ? (
        <aside className={styles.connectionNotice} role="alert">
          <div><strong>{connectionStatus === "offline" ? "Você está sem conexão" : connectionStatus === "retrying" ? "Reconectando sua cozinha..." : "Não conseguimos conectar à sala"}</strong><p>{status} As etapas ficam bloqueadas até uma conexão segura ser confirmada.</p></div>
          {(connectionStatus === "offline" || connectionStatus === "unavailable") ? <button type="button" onClick={() => connection.current?.retry()}>Tentar reconectar</button> : null}
        </aside>
      ) : null}

      {room ? (
        <>
          <section aria-label="Progresso compartilhado" className={styles.progressPanel}>
            <div className={styles.progressCopy}>
              <p className={styles.sectionEyebrow}>NOSSO PROGRESSO</p>
              <h2>{allDone ? "Conseguimos, chefes!" : "Cada etapa conta."}</h2>
              <p>Progresso: {finished} de {total} etapas concluídas</p>
              <progress value={finished} max={total} aria-label="Etapas concluídas" />
              <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: percentage + "%" }} /></div>
              <p className={styles.progressHint}>{allDone ? "Todas as etapas foram finalizadas. Bom apetite!" : "O progresso é atualizado para todas as pessoas nesta sala."}</p>
            </div>
            <div className={styles.progressRing} style={{ background: "conic-gradient(#f4c77b " + percentage + "%, rgba(255,255,255,.18) 0)" }}>
              <div><strong>{percentage}%</strong><small>concluído</small></div>
            </div>
          </section>

          <div className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <section className={styles.guidedCard} aria-labelledby="guided-heading">
                <div className={styles.guidedTop}>
                  <span className={styles.guidedOverline}><span className={styles.sparkle} aria-hidden="true">✦</span> MODO PREPARO</span>
                  <span className={styles.stepCounter}>PASSO {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
                </div>
                <p className={styles.stepSubheading}>{room.completed[currentIndex] ? "Essa parte já foi feita!" : "Agora é a vez deste passo"}</p>
                <h2 id="guided-heading">{currentStep}</h2>
                {suggestion !== null ? (
                  <button type="button" className={styles.suggestion} onClick={() => startTimer(suggestion)}>
                    <span aria-hidden="true">◷</span> Iniciar timer sugerido de {displayDuration(suggestion)}
                  </button>
                ) : <p className={styles.guidedTip}><span aria-hidden="true">✳</span> Vá com calma: todos acompanham a mesma receita.</p>}
                <div className={styles.guidedActions}>
                  <button type="button" className={styles.completeButton} disabled={!connected} onClick={() => toggle(currentIndex)}>
                    <span aria-hidden="true">{room.completed[currentIndex] ? "↶" : "✓"}</span>
                    {room.completed[currentIndex] ? "Desmarcar etapa" : "Concluir esta etapa"}
                  </button>
                  <div className={styles.stepNavigation} aria-label="Navegar pelas etapas">
                    <button type="button" aria-label="Etapa anterior" disabled={currentIndex === 0} onClick={() => setSelectedIndex(Math.max(0, currentIndex - 1))}>←</button>
                    <button type="button" aria-label="Próxima etapa" disabled={currentIndex === total - 1} onClick={() => setSelectedIndex(Math.min(total - 1, currentIndex + 1))}>→</button>
                  </div>
                </div>
                <p className={styles.confirmationNote}>As alterações só aparecem como concluídas depois da confirmação do servidor.</p>
              </section>

              <section className={styles.stepsPanel} aria-labelledby="steps-heading">
                <div className={styles.stepsHeading}>
                  <div>
                    <p className={styles.sectionEyebrow}>ROTEIRO DA RECEITA</p>
                    <h2 id="steps-heading">O caminho até ficar pronto</h2>
                  </div>
                  <span className={styles.stepsCount}>{total} etapas</span>
                </div>
                <ol className={styles.stepsList}>
                  {steps.map((step, index) => (
                    <li key={index} className={[styles.stepItem, currentIndex === index ? styles.stepItemActive : "", room.completed[index] ? styles.stepItemDone : ""].filter(Boolean).join(" ")}>
                      <label className={styles.stepLabel}>
                        <input type="checkbox" checked={Boolean(room.completed[index])} onChange={() => toggle(index)} disabled={!connected} aria-label={"Concluir etapa " + (index + 1) + ": " + step} />
                        <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <span className={styles.stepBody}><span className={styles.stepText}>{step}</span><small>{room.completed[index] ? "Concluída por alguém da sala" : "A fazer"}</small></span>
                      </label>
                      <button type="button" onClick={() => setSelectedIndex(index)} className={styles.focusStep} aria-label={"Ver detalhes da etapa " + (index + 1)} aria-current={index === currentIndex ? "step" : undefined}>↗</button>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <aside className={styles.sidebar} aria-label="Ferramentas da cozinha">
              <section className={styles.toolCard} aria-labelledby="timer-title">
                <p className={styles.sectionEyebrow}>SUA BANCADA</p>
                <div className={styles.toolHeading}><h2 id="timer-title">Timer de cozinha</h2><span aria-hidden="true">◷</span></div>
                <p className={styles.toolDescription}>O tempo fica só neste aparelho, sem interferir na receita compartilhada.</p>
                <div className={styles.timerDisplay} role="timer" aria-label={"Tempo restante " + displayClock(timerSeconds)}>{displayClock(timerSeconds)}</div>
                <div className={styles.timerPresets} aria-label="Tempos rápidos">
                  {[1, 5, 10, 15].map((minutes) => <button type="button" key={minutes} onClick={() => startTimer(minutes * 60)}>{minutes} min</button>)}
                </div>
                <div className={styles.timerActions}>
                  {timerSeconds > 0 ? <button type="button" onClick={timerRunning ? pauseTimer : () => setTimerEnd(Date.now() + timerSeconds * 1000)}>{timerRunning ? "Pausar" : "Continuar"}</button> : null}
                  <button type="button" onClick={resetTimer} disabled={timerSeconds === 0}>Zerar</button>
                </div>
                {timerSeconds === 0 && !timerRunning ? <span className={styles.timerNote} aria-live="polite">Escolha um tempo para começar.</span> : null}
              </section>

              <section className={styles.toolCard} aria-labelledby="ingredients-title">
                <p className={styles.sectionEyebrow}>TUDO À MÃO</p>
                <div className={styles.toolHeading}><h2 id="ingredients-title">Ingredientes</h2><span aria-hidden="true">✳</span></div>
                {recipe?.ingredients?.length ? (
                  <ul className={styles.ingredientsList}>
                    {recipe.ingredients.map((ingredient) => {
                      const amount = formatIngredientAmount(ingredient.quantity, ingredient.unit);
                      return <li key={ingredient.ingredientId}><span aria-hidden="true">•</span><div><strong>{ingredient.name}</strong><small>{ingredient.rawText || amount || "A gosto"}{ingredient.optional ? " · opcional" : ""}</small></div></li>;
                    })}
                  </ul>
                ) : <p className={styles.toolDescription}>Confira a lista de ingredientes e as quantidades na receita original.</p>}
                <Link className={styles.ingredientsLink} href={"/receitas/" + room.recipeSlug}>Abrir receita e ingredientes <span aria-hidden="true">↗</span></Link>
              </section>

              <div className={styles.sideReminder}><span aria-hidden="true">♥</span><p>O melhor ingrediente é fazer junto. <strong>Compartilhe seu convite!</strong></p></div>
            </aside>
          </div>

          {allDone ? (
            <section className={styles.finishBanner} aria-live="polite">
              <span aria-hidden="true">✳</span>
              <div><p className={styles.sectionEyebrow}>MISSÃO CUMPRIDA</p><h2>Da nossa cozinha para a mesa!</h2><p>Vocês finalizaram todas as etapas. Agora é só aproveitar.</p></div>
              <button type="button" onClick={() => void copyInvite()}>Compartilhar resultado ↗</button>
            </section>
          ) : null}
        </>
      ) : (
        <section className={styles.loadingPanel} role="status">
          <div className={styles.loadingSymbol} aria-hidden="true">✳</div>
          <h2>Preparando sua cozinha...</h2>
          <p>As etapas aparecerão assim que a conexão com a sala for confirmada.</p>
          {connectionStatus === "unavailable" ? <button type="button" onClick={() => connection.current?.retry()}>Tentar novamente</button> : null}
        </section>
      )}
    </main>
  );
}
