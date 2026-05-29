import { CustomError } from '../middlewares/errorHandler';
import { IDocumentResultRepository } from '../repositories/IDocumentResultRepository';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { DocumentChatBridgeBuilder } from '../services/DocumentChatBridgeBuilder';
import { ResultTokenService } from '../services/ResultTokenService';
import { DocumentChatBridgeContext, DocumentResponse } from '../types/fortune';
import { CreateFortuneSessionUseCase } from './CreateFortuneSessionUseCase';
import { FormType, FortuneCategory, SessionMode } from '../types/fortune';

interface StartChatFromDocumentParams {
  userId: string;
  documentId: string;
  forceNewSession?: boolean;
}

export interface StartChatFromDocumentResult {
  sessionId: string;
  category: FortuneCategory;
  formType: FormType;
  mode: SessionMode;
  resultToken: string;
  reusedSession: boolean;
  sourceDocumentId: string;
}

export class StartChatFromDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentResultRepository,
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly createSessionUseCase: CreateFortuneSessionUseCase,
    private readonly resultTokenService: ResultTokenService,
    private readonly documentChatBridgeBuilder: DocumentChatBridgeBuilder,
  ) {}

  async execute(
    params: StartChatFromDocumentParams,
  ): Promise<StartChatFromDocumentResult> {
    const { userId, documentId, forceNewSession } = params;

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new CustomError('문서를 찾을 수 없습니다.', 404, 'INVALID_REQUEST');
    }

    if (document.userId !== userId) {
      throw new CustomError('해당 문서에 접근할 수 없습니다.', 403, 'AUTH_REQUIRED');
    }

    if (document.isExpired()) {
      throw new CustomError('만료된 문서입니다.', 400, 'INVALID_REQUEST');
    }

    const documentPayload = this.parseDocumentPayload(document);

    const existingSession = forceNewSession
      ? null
      : await this.sessionRepository.findActiveByUserIdAndCategory(
          userId,
          document.category,
          SessionMode.CHAT,
        );

    const chatUserInput =
      documentPayload.chatPrompt ||
      documentPayload.summary ||
      `${document.title} 결과를 바탕으로 더 자세히 상담하고 싶어요.`;

    const bridgeState = await this.ensureDocumentChatContext(document, documentPayload);

    const session =
      existingSession ||
      (await this.createSessionUseCase.execute({
        userId,
        category: document.category,
        formType: FormType.TRADITIONAL,
        mode: SessionMode.CHAT,
        userInput: chatUserInput,
      }));

    const mergedUserData = {
      ...(session.userData || {}),
      documentBridge: {
        sourceDocumentId: document.id,
        attachedAt: new Date().toISOString(),
        bridgeVersion: bridgeState.version,
        category: document.category,
        title: document.title,
        anchorSummary: bridgeState.context?.anchorSummary ?? null,
        topicCards: bridgeState.context?.topicCards ?? [],
        followupMap: bridgeState.context?.followupMap ?? [],
        riskNotes: bridgeState.context?.riskNotes ?? [],
      },
    };

    const updatedSession = await this.sessionRepository.updateSessionData(session.id, {
      userInput: session.userInput || chatUserInput,
      userData: mergedUserData,
    });

    return {
      sessionId: updatedSession.id,
      category: updatedSession.category,
      formType: updatedSession.formType || FormType.TRADITIONAL,
      mode: updatedSession.mode,
      resultToken: this.resultTokenService.sign({
        sessionId: updatedSession.id,
        userId,
        category: updatedSession.category,
        formType: (updatedSession.formType || FormType.TRADITIONAL) as FormType,
        mode: updatedSession.mode,
      }),
      reusedSession: !!existingSession,
      sourceDocumentId: document.id,
    };
  }

  private parseDocumentPayload(document: {
    title: string;
    content: string;
  }): {
    chatPrompt?: string;
    summary?: string;
    content?: string;
  } {
    try {
      return JSON.parse(document.content) as {
        chatPrompt?: string;
        summary?: string;
        content?: string;
      };
    } catch {
      return {
        summary: document.title,
        content: document.content,
        chatPrompt: `${document.title} 결과를 바탕으로 더 자세히 상담하고 싶어요.`,
      };
    }
  }

  private async ensureDocumentChatContext(
    document: {
      id: string;
      title: string;
      content: string;
      category: FortuneCategory;
      chatContext: DocumentChatBridgeContext | null;
      chatContextVersion: number;
    },
    payload: {
      chatPrompt?: string;
      summary?: string;
      content?: string;
      advice?: string[];
      warnings?: string[];
      date?: string;
      title?: string;
    },
  ): Promise<{
    context: DocumentChatBridgeContext | null;
    version: number;
  }> {
    if (document.chatContext) {
      return {
        context: document.chatContext,
        version: document.chatContextVersion,
      };
    }

    const normalizedDocument = this.isStructuredDocumentPayload(payload)
      ? payload
      : this.buildLegacyDocumentResponse(document, payload);

    const updated = await this.documentRepository.updateChatContext(
      document.id,
      this.documentChatBridgeBuilder.build({
        category: document.category,
        userInput: normalizedDocument.summary || document.title,
        document: normalizedDocument,
      }),
      1,
    );

    return {
      context: updated.chatContext,
      version: updated.chatContextVersion,
    };
  }

  private buildLegacyDocumentResponse(
    document: {
      title: string;
      content: string;
    },
    payload: {
      chatPrompt?: string;
      summary?: string;
      content?: string;
    },
  ): DocumentResponse {
    const baseContent = (payload.content || document.content || '').trim();
    const normalizedContent = baseContent.replace(/\s+/g, ' ').trim();
    const paragraphSummary = normalizedContent
      .split(/\.\s+|\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join('. ');

    return {
      title: document.title,
      date: new Date().toISOString().slice(0, 10),
      summary: payload.summary || paragraphSummary || document.title,
      content: baseContent || document.title,
      advice: [],
      warnings: [],
      chatPrompt:
        payload.chatPrompt ||
        `${document.title} 결과를 바탕으로 더 자세히 상담하고 싶어요.`,
    };
  }

  private isStructuredDocumentPayload(
    payload: {
      chatPrompt?: string;
      summary?: string;
      content?: string;
      advice?: string[];
      warnings?: string[];
      date?: string;
      title?: string;
    },
  ): payload is DocumentResponse {
    return (
      typeof payload.title === 'string' &&
      typeof payload.date === 'string' &&
      typeof payload.summary === 'string' &&
      typeof payload.content === 'string' &&
      Array.isArray(payload.advice) &&
      Array.isArray(payload.warnings) &&
      typeof payload.chatPrompt === 'string'
    );
  }
}
