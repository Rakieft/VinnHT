import React, { useState } from "react";
import { LockKeyhole } from "lucide-react";

export default function AccountSecuritySettings({ api, onMessage }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmation: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmation) {
      onMessage("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmation: "" });
      onMessage(data.message);
    } catch (error) {
      onMessage(
        error.response?.data?.message ||
          "Impossible de modifier le mot de passe.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="account-security-settings">
      <div className="account-security-heading">
        <span>
          <LockKeyhole />
        </span>
        <div>
          <small>Sécurité du compte</small>
          <h2>Modifier le mot de passe</h2>
          <p>
            Utilisez au moins 10 caractères avec une majuscule, une minuscule
            et un chiffre.
          </p>
        </div>
      </div>
      <form onSubmit={submit}>
        <label>
          Mot de passe actuel
          <input
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={update}
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          Nouveau mot de passe
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={update}
            autoComplete="new-password"
            minLength={10}
            required
          />
        </label>
        <label>
          Confirmer le nouveau mot de passe
          <input
            type="password"
            name="confirmation"
            value={form.confirmation}
            onChange={update}
            autoComplete="new-password"
            minLength={10}
            required
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Modification..." : "Modifier le mot de passe"}
        </button>
      </form>
    </section>
  );
}
