import { Router } from 'express';
import { cadastrarUser, myProfile, getMemberById, updateMemberController, deactivateMemberController, updatePasswordController, esqueciSenhaController, redefinirSenhaController } from '../controllers/membroController';
import { loginUser } from '../controllers/membroController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autoriza } from '../middlewares/roleMiddleware';
import { listAllMembers } from '../controllers/membroController';

const router = Router();

router.post('/cadastro', authMiddleware, autoriza('membro.cadastrar'),cadastrarUser);
router.post('/login', loginUser);
router.post('/esqueci-senha', esqueciSenhaController);
router.post('/redefinir-senha', redefinirSenhaController);
router.get('/me', authMiddleware, myProfile);
router.get('/', authMiddleware, autoriza('membro.listar'), listAllMembers);
router.get('/:id', authMiddleware, getMemberById)
router.put('/:id', authMiddleware, updateMemberController)
router.delete('/:id', authMiddleware, autoriza('membro.desativar'), deactivateMemberController)
router.put('/:id/senha', authMiddleware, updatePasswordController)

export default router;
