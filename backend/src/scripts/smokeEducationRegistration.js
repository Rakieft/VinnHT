import "dotenv/config";
import pool from "../config/database.js";

const apiUrl = process.env.API_URL || "http://localhost:5056/api";
const suffix = Date.now();
const studentEmail = `education-student-${suffix}@vinnht.test`;
const optionalEmail = `education-optional-${suffix}@vinnht.test`;
const password = "VinnHT-Test!2026";

const register = async (email, educationStatus, educationInstitution) => {
  const response = await fetch(`${apiUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Education VinnHT",
      email,
      phone: "37009999",
      password,
      ...(educationStatus ? { educationStatus } : {}),
      ...(educationInstitution ? { educationInstitution } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Inscription impossible: ${response.status} ${await response.text()}`);
  }

  return {
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
};

try {
  const student = await register(
    studentEmail,
    "university",
    "Universite Quisqueya",
  );
  if (
    student.data.user.education_status !== "university" ||
    student.data.user.education_institution !== "Universite Quisqueya" ||
    student.data.user.education_verified_at !== null
  ) {
    throw new Error("Le statut etudiant n'a pas ete stocke comme auto-declare.");
  }

  const profileResponse = await fetch(`${apiUrl}/auth/me`, {
    headers: { Cookie: student.cookie },
  });
  const profile = await profileResponse.json();
  if (
    profile.education_status !== "university" ||
    profile.education_institution !== "Universite Quisqueya"
  ) {
    throw new Error("Le statut etudiant n'est pas renvoye dans le profil.");
  }

  const optional = await register(optionalEmail);
  if (optional.data.user.education_status !== null) {
    throw new Error("Le statut educatif devrait rester facultatif.");
  }

  console.table({
    student: {
      status: student.data.user.education_status,
      institution: student.data.user.education_institution,
      verified: student.data.user.education_verified_at,
    },
    optional: {
      status: optional.data.user.education_status,
      institution: optional.data.user.education_institution,
      verified: optional.data.user.education_verified_at,
    },
  });
} finally {
  await pool.query("DELETE FROM users WHERE email IN (?,?)", [studentEmail, optionalEmail]);
  await pool.end();
}
