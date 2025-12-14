import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import './Login.css';

const validationSchema = Yup.object({
  userName: Yup.string()
    .required('Kullanıcı adı gerekli')
    .min(3, 'En az 3 karakter olmalı'),
  password: Yup.string()
    .required('Şifre gerekli')
    .min(6, 'En az 6 karakter olmalı'),
});

const Login: React.FC = () => {
  const { login } = useAuth();
  const [error, setError] = React.useState<string>('');

  const formik = useFormik({
    initialValues: {
      userName: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      const success = await login(values.userName, values.password);
      if (!success) {
        setError('Kullanıcı adı veya şifre hatalı');
      }
    },
  });

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <LogIn size={48} />
          <h1>OtelOPS</h1>
          <p>Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={formik.handleSubmit}>
          <div className="form-group">
            <label htmlFor="userName" className="form-label">
              Kullanıcı Adı
            </label>
            <input
              id="userName"
              name="userName"
              type="text"
              className="form-input"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.userName}
            />
            {formik.touched.userName && formik.errors.userName && (
              <div className="form-error">{formik.errors.userName}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="form-error">{formik.errors.password}</div>
            )}
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary login-btn" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2025 OtelOPS. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
