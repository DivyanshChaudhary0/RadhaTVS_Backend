import bcrypt from "bcryptjs";

const password = "admin123"; // your desired password

bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log(hash);
});
