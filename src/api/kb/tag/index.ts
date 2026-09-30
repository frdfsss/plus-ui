import type { KbTagForm, KbTagQuery, KbTagVO } from '@/api/kb/tag/types';
import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 分页查询标签列表
 */
export const listKbTag = (query?: KbTagQuery): AxiosPromise<PageResult<KbTagVO>> => {
  return request({
    url: '/kb/tag/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询标签列表（不分页）
 */
export const listKbTagAll = (query?: KbTagQuery): AxiosPromise<KbTagVO[]> => {
  return request({
    url: '/kb/tag/listAll',
    method: 'get',
    params: query
  });
};

/**
 * 查询标签详情
 */
export const getKbTag = (id: string | number): AxiosPromise<KbTagVO> => {
  return request({
    url: '/kb/tag/' + id,
    method: 'get'
  });
};

/**
 * 新增标签
 */
export const addKbTag = (data: KbTagForm) => {
  return request({
    url: '/kb/tag',
    method: 'post',
    data: data
  });
};

/**
 * 修改标签
 */
export const updateKbTag = (data: KbTagForm) => {
  return request({
    url: '/kb/tag',
    method: 'put',
    data: data
  });
};

/**
 * 删除标签
 */
export const delKbTag = (id: string | number | Array<string | number>) => {
  return request({
    url: '/kb/tag/' + id,
    method: 'delete'
  });
};
