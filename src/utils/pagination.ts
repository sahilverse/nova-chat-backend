// utils/pagination.ts
import { Prisma } from "@prisma/client";


export interface PaginationParams {
    limit?: number;
    cursor?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    nextCursor: string | null;
    hasNextPage: boolean;
    limit: number;

}

export async function paginate<T>(
    model: { findMany: Function },
    args: Prisma.UserFindManyArgs | Prisma.UserChatFindManyArgs | Prisma.MessageFindManyArgs,
    params: PaginationParams,
): Promise<PaginatedResult<T>> {
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 10;
    const cursor = params.cursor || null;

    const results = await model.findMany({
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        ...args,
    });

    let nextCursor: string | null = null;
    if (results.length > limit) {
        const nextItem = results.pop();
        nextCursor = (nextItem as any).id;
    }

    return {
        data: results,
        nextCursor,
        hasNextPage: !!nextCursor,
        limit,
    };
}
