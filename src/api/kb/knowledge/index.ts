import type { KnowledgeForm, KnowledgeQuery, KnowledgeVO } from '@/api/kb/knowledge/types';
import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 分页查询知识列表
 */
export const listKnowledge = (query?: KnowledgeQuery): AxiosPromise<PageResult<KnowledgeVO>> => {
  return request({
    url: '/kb/knowledge/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询知识列表（不分页）
 */
export const listKnowledgeAll = (query?: KnowledgeQuery): AxiosPromise<KnowledgeVO[]> => {
  return request({
    url: '/kb/knowledge/listAll',
    method: 'get',
    params: query
  });
};

/**
 * 查询知识详情
 */
export const getKnowledge = (id: string | number): AxiosPromise<KnowledgeVO> => {
  return request({
    url: '/kb/knowledge/' + id,
    method: 'get'
  });
};

/**
 * 新增知识
 */
export const addKnowledge = (data: KnowledgeForm) => {
  return request({
    url: '/kb/knowledge',
    method: 'post',
    data: data
  });
};

/**
 * 修改知识
 */
export const updateKnowledge = (data: KnowledgeForm) => {
  return request({
    url: '/kb/knowledge',
    method: 'put',
    data: data
  });
};

/**
 * 删除知识
 */
export const delKnowledge = (id: string | number | Array<string | number>) => {
  return request({
    url: '/kb/knowledge/' + id,
    method: 'delete'
  });
};
