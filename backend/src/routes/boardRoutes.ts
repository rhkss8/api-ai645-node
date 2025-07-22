import { Router } from 'express';
import { BoardController } from '../controllers/BoardController';
import { authenticateAccess, optionalAuthenticateAccess, requireRole } from '../middlewares/auth';

export const createBoardRoutes = (boardController: BoardController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/board/{category}:
   *   get:
   *     operationId: getBoardPosts
   *     summary: 게시글 목록 조회
   *     tags: [Board]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum: [NOTICE, SUGGESTION, PARTNERSHIP]
   *         description: 게시판 카테고리
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: 페이지당 항목 수
   *     responses:
   *       200:
   *         description: 게시글 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     posts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           category:
   *                             type: string
   *                           title:
   *                             type: string
   *                           authorName:
   *                             type: string
   *                           isImportant:
   *                             type: boolean
   *                           viewCount:
   *                             type: integer
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         limit:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *                         hasNext:
   *                           type: boolean
   *                         hasPrev:
   *                           type: boolean
   *       400:
   *         description: 유효하지 않은 카테고리
   *       401:
   *         description: 인증 필요 (선택사항 - 토큰이 있으면 개인화된 데이터 제공)
   */
  router.get('/:category', optionalAuthenticateAccess, boardController.getPosts);

  /**
   * @swagger
   * /api/board/{category}:
   *   post:
   *     operationId: createBoardPost
   *     summary: 게시글 생성
   *     tags: [Board]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum: [NOTICE, SUGGESTION, PARTNERSHIP]
   *         description: 게시판 카테고리
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - content
   *               - authorName
   *             properties:
   *               title:
   *                 type: string
   *                 maxLength: 200
   *                 description: 게시글 제목
   *               content:
   *                 type: string
   *                 maxLength: 10000
   *                 description: 게시글 내용
    *               authorName:
 *                 type: string
 *                 maxLength: 40
 *                 description: 작성자 이름 (모든 카테고리에서 필수)
   *               isImportant:
   *                 type: boolean
   *                 default: false
   *                 description: 중요공지 여부
   *     responses:
   *       201:
   *         description: 게시글 생성 성공
   *       400:
   *         description: 유효하지 않은 입력
   *       401:
   *         description: 인증 필요
   */
  router.post('/:category', authenticateAccess, boardController.createPost);

  /**
   * @swagger
   * /api/board/post/{id}:
   *   get:
   *     operationId: getBoardPost
   *     summary: 게시글 조회 (단일)
   *     tags: [Board]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 게시글 ID
   *     responses:
   *       200:
   *         description: 게시글 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     category:
   *                       type: string
   *                     title:
   *                       type: string
   *                     content:
   *                       type: string
   *                     authorName:
   *                       type: string
   *                     authorId:
   *                       type: string
   *                     isImportant:
   *                       type: boolean
   *                     viewCount:
   *                       type: integer
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: 게시글을 찾을 수 없음
   */
  router.get('/post/:id', boardController.getPost);

  /**
   * @swagger
   * /api/board/post/{id}:
   *   put:
   *     operationId: updateBoardPost
   *     summary: 게시글 수정
   *     tags: [Board]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 게시글 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 maxLength: 200
   *                 description: 게시글 제목
   *               content:
   *                 type: string
   *                 maxLength: 10000
   *                 description: 게시글 내용
   *               isImportant:
   *                 type: boolean
   *                 description: 중요공지 여부
   *     responses:
   *       200:
   *         description: 게시글 수정 성공
   *       400:
   *         description: 유효하지 않은 입력 또는 권한 없음
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 게시글을 찾을 수 없음
   */
  router.put('/post/:id', authenticateAccess, boardController.updatePost);

  /**
   * @swagger
   * /api/board/post/{id}:
   *   delete:
   *     operationId: deleteBoardPost
   *     summary: 게시글 삭제
   *     tags: [Board]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 게시글 ID
   *     responses:
   *       200:
   *         description: 게시글 삭제 성공
   *       400:
   *         description: 권한 없음
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 게시글을 찾을 수 없음
   */
  router.delete('/post/:id', authenticateAccess, boardController.deletePost);

  /**
   * @swagger
   * /api/board/my:
   *   get:
   *     operationId: getMyBoardPosts
   *     summary: 내가 작성한 게시글 목록 조회
   *     tags: [Board]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: 페이지당 항목 수
   *     responses:
   *       200:
   *         description: 내 게시글 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     posts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           category:
   *                             type: string
   *                           title:
   *                             type: string
   *                           content:
   *                             type: string
   *                           authorName:
   *                             type: string
   *                           authorId:
   *                             type: string
   *                           isImportant:
   *                             type: boolean
   *                           viewCount:
   *                             type: integer
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                           updatedAt:
   *                             type: string
   *                             format: date-time
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         limit:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *                         hasNext:
   *                           type: boolean
   *                         hasPrev:
   *                           type: boolean
   *       401:
   *         description: 인증 필요
   */
  router.get('/my', authenticateAccess, boardController.getMyPosts);

  return router;
}; 