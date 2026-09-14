"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

import { ApiError } from "@/services/api-client";
import { submitRecipe } from "@/services/recipe-submissions.service";

import styles from "./RecipeSubmissionForm.module.css";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type FormStep = 1 | 2 | 3;

type ReviewData = {
  title: string;
  description: string;
  mealType: string;
  prepMinutes: string;
  servings: string;
  difficulty: string;
  ingredientsCount: number;
  instructionsCount: number;
};

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.replace(/^[-•\d.)\s]+/, "").trim()).filter(Boolean);
}

export function RecipeSubmissionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<FormStep>(1);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [review, setReview] = useState<ReviewData | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setMessage("");
    if (!file) { setImageName(""); setPreviewUrl(""); return; }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) { event.currentTarget.value = ""; setImageName(""); setPreviewUrl(""); setError("Use uma foto JPG, PNG ou WebP."); return; }
    if (file.size > MAX_IMAGE_BYTES) { event.currentTarget.value = ""; setImageName(""); setPreviewUrl(""); setError("A foto pode ter no máximo 12 MB."); return; }
    setError("");
    setImageName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function validateStep(currentStep: FormStep): boolean {
    const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${currentStep}"]`);
    if (!section) return true;
    const controls = Array.from(section.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"));
    const invalid = controls.find((control) => !control.checkValidity());
    if (!invalid) return true;
    invalid.reportValidity();
    invalid.focus();
    return false;
  }

  function buildReview() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    setReview({
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      mealType: String(data.get("mealType") ?? "") || "Receita",
      prepMinutes: String(data.get("prepMinutes") ?? ""),
      servings: String(data.get("servings") ?? ""),
      difficulty: String(data.get("difficulty") ?? "FACIL"),
      ingredientsCount: lines(String(data.get("ingredients") ?? "")).length,
      instructionsCount: lines(String(data.get("instructions") ?? "")).length,
    });
  }

  function nextStep() {
    if (!validateStep(step)) return;
    setError("");
    setMessage("");
    if (step === 1) setStep(2);
    if (step === 2) { buildReview(); setStep(3); }
  }

  function previousStep() {
    setError("");
    setStep((current) => (current === 3 ? 2 : 1));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 3) { nextStep(); return; }

    setSending(true);
    setMessage("");
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const imageEntry = form.get("image");
    const image = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : undefined;

    if (!image) { setError("Escolha uma foto do prato para enviar a receita."); setSending(false); return; }

    try {
      const response = await submitRecipe({
        authorName: String(form.get("authorName") ?? ""),
        authorEmail: String(form.get("authorEmail") ?? ""),
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        ingredients: lines(String(form.get("ingredients") ?? "")),
        instructions: lines(String(form.get("instructions") ?? "")),
        prepMinutes: Number(form.get("prepMinutes")) || undefined,
        servings: Number(form.get("servings")) || undefined,
        mealType: String(form.get("mealType") ?? ""),
        difficulty: String(form.get("difficulty") ?? "FACIL") as "FACIL" | "MEDIA" | "DIFICIL",
        image,
        website: String(form.get("website") ?? ""),
      });
      setMessage(response.message);
      formElement.reset();
      setImageName("");
      setPreviewUrl("");
      setReview(null);
      setStep(1);
    } catch (submitError: unknown) {
      setError(submitError instanceof ApiError ? submitError.message : "Não foi possível enviar sua receita agora. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  const difficultyLabel = review?.difficulty === "DIFICIL" ? "Difícil" : review?.difficulty === "MEDIA" ? "Média" : "Fácil";

  return (
    <form className={styles.form} onSubmit={onSubmit} ref={formRef}>
      <div aria-label={`Etapa ${step} de 3`} className={styles.progress}>
        <div className={styles.progressHeader}><span>Etapa {step} de 3</span><strong>{step === 1 ? "Sua receita" : step === 2 ? "Como preparar" : "Foto e revisão"}</strong></div>
        <div className={styles.progressTrack}><span style={{ width: `${(step / 3) * 100}%` }} /></div>
        <ol><li className={step >= 1 ? styles.stepActive : undefined}>Receita</li><li className={step >= 2 ? styles.stepActive : undefined}>Preparo</li><li className={step >= 3 ? styles.stepActive : undefined}>Revisão</li></ol>
      </div>

      <section className={styles.stepPanel} data-step="1" hidden={step !== 1}>
        <div className={styles.stepIntro}><span>01</span><div><h2>Conte a história do prato</h2><p>Comece pelo essencial. Depois a gente entra nos ingredientes e no preparo.</p></div></div>
        <div className={styles.gridTwo}><label><span>Seu nome</span><input name="authorName" required minLength={2} placeholder="Como quer aparecer" /></label><label><span>E-mail <small>(opcional)</small></span><input name="authorEmail" type="email" inputMode="email" autoComplete="email" placeholder="Para contato sobre a receita" /></label></div>
        <label><span>Nome da receita</span><input name="title" required minLength={3} placeholder="Ex.: Bolo de banana da vó" /></label>
        <label><span>Conte um pouco sobre ela</span><textarea name="description" required minLength={10} rows={3} placeholder="O que torna essa receita especial?" /></label>
        <div className={styles.gridThree}><label><span>Tempo <small>(minutos)</small></span><input name="prepMinutes" type="number" min={1} max={1440} inputMode="numeric" /></label><label><span>Porções</span><input name="servings" type="number" min={1} max={100} inputMode="numeric" /></label><label><span>Dificuldade</span><select defaultValue="FACIL" name="difficulty"><option value="FACIL">Fácil</option><option value="MEDIA">Média</option><option value="DIFICIL">Difícil</option></select></label></div>
        <label><span>Tipo de refeição</span><input name="mealType" placeholder="Café da manhã, almoço, sobremesa..." /></label>
      </section>

      <section className={styles.stepPanel} data-step="2" hidden={step !== 2}>
        <div className={styles.stepIntro}><span>02</span><div><h2>Agora, mão na massa</h2><p>Um ingrediente e um passo por linha deixam a receita fácil de revisar e seguir.</p></div></div>
        <div className={styles.gridTwo}><label><span>Ingredientes</span><textarea name="ingredients" required rows={11} placeholder={"1 ingrediente por linha\n2 bananas maduras\n2 ovos\n1 xícara de farinha"} /></label><label><span>Modo de preparo</span><textarea name="instructions" required rows={11} placeholder={"1 passo por linha\nAmasse as bananas\nMisture os ovos\nLeve ao forno..."} /></label></div>
      </section>

      <section className={styles.stepPanel} data-step="3" hidden={step !== 3}>
        <div className={styles.stepIntro}><span>03</span><div><h2>Último olhar antes de enviar</h2><p>Escolha a foto e confira o resumo. Você ainda pode voltar e ajustar qualquer etapa.</p></div></div>
        <div className={styles.reviewCard}><div><span>{review?.mealType}</span><h3>{review?.title || "Sua receita"}</h3><p>{review?.description}</p></div><dl>{review?.prepMinutes ? <div><dt>Tempo</dt><dd>{review.prepMinutes} min</dd></div> : null}{review?.servings ? <div><dt>Porções</dt><dd>{review.servings}</dd></div> : null}<div><dt>Dificuldade</dt><dd>{difficultyLabel}</dd></div><div><dt>Conteúdo</dt><dd>{review?.ingredientsCount ?? 0} ingredientes · {review?.instructionsCount ?? 0} passos</dd></div></dl></div>
        <div className={styles.photoField}>
          <div className={styles.photoHeading}><div><strong>Foto do prato</strong><p>No celular, toque abaixo para tirar uma foto ou escolher da galeria.</p></div><span>JPG, PNG ou WebP · até 12 MB</span></div>
          <label className={styles.photoPicker}><input accept="image/jpeg,image/png,image/webp" name="image" onChange={handleImageChange} required type="file" /><span className={styles.photoPickerButton}>Escolher foto</span><span className={styles.photoPickerName}>{imageName || "Nenhuma foto escolhida"}</span></label>
          {previewUrl ? <div className={styles.photoPreview}>{/* eslint-disable-next-line @next/next/no-img-element -- object URL local antes do upload */}<img alt="Prévia da foto escolhida" src={previewUrl} /><span>Prévia da foto que será enviada</span></div> : null}
        </div>
        <div className={styles.notice}><strong>Antes de publicar</strong><p>A receita fica em análise para evitar conteúdo duplicado, imagens sem permissão e receitas incompletas.</p></div>
      </section>

      <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" />
      {message ? <p className={styles.success} role="status">{message}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.actions}>{step > 1 ? <button className={styles.back} disabled={sending} onClick={previousStep} type="button">← Voltar</button> : <span />}{step < 3 ? <button className={styles.next} onClick={nextStep} type="button">Continuar <span aria-hidden="true">→</span></button> : <button className={styles.submit} disabled={sending} type="submit">{sending ? "Enviando receita e foto..." : "Enviar minha receita"}</button>}</div>
    </form>
  );
}
