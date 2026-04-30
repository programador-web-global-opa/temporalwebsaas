
const TITLE_APP = "FONDOOPA | Servicios en Linea";

const afiliacionRegisterRender = (req, res) => {
    res.render("afiliacion/register", {
        title: TITLE_APP,
        layout: "layouts/auth",
    });
}

const afiliacionGenerateRender = (req, res) => {
    const mockSessionData = {
      id: '',
      token: '',
      tokenWeb: '',
      nombreusuario: '',
      ultimoingreso: '',
      loginAt: Date.now(),
      isAfliacion: true,
    };
    req.session.user = mockSessionData;
    res.render("afiliacion/generate", {
        title: TITLE_APP,
        session: req.session,
    });
}

const afiliacionValidateDocument = async (req, res) => {
    const { document, typeDocument, typePerson } = req.body;
    try {
        req.session.afil = {
            document,
            tokenTemporal: "token_temporal_generado_para_" + document,
            typeDocument: typeDocument,
            typePerson: typePerson
        }
        res.redirect("/afiliacion/generate");
    } catch (error) {
        res.status(500).json({ error: true, message: "Ha ocurrido un error al validar el documento" });
    }
}

module.exports = {
    afiliacionRegisterRender,
    afiliacionGenerateRender,
    afiliacionValidateDocument
};