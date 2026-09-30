<template>
  <div class="p-2 app-container kb-knowledge-search">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div><h3>筛选条件</h3></div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="关键字" prop="keyword">
            <el-input
              v-model="queryParams.keyword"
              placeholder="标题或标签"
              clearable
              style="width: 240px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="知识状态" clearable style="width: 180px">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>知识库查询</h3>
          </div>
          <div class="toolbar-actions">
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border class="data-table" :data="knowledgeList">
        <el-table-column label="标题" align="left" prop="title" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="标签" align="center" prop="tags" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            <el-tag v-for="tag in splitTags(scope.row.tags)" :key="tag" size="small" class="kb-tag">{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="附件" align="center" prop="fileName" min-width="140" show-overflow-tooltip />
        <el-table-column label="创建人" align="center" prop="createByName" width="100" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="90">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button v-hasPermi="['kb:knowledge:query']" link type="primary" icon="View" @click="handleView(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <el-dialog v-model="detail.visible" :title="detail.title" width="820px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题" :span="2">{{ form.title }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="statusOptions" :value="form.status" />
        </el-descriptions-item>
        <el-descriptions-item label="项目">{{ form.projectName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag v-for="tag in splitTags(form.tags)" :key="tag" size="small" class="kb-tag">{{ tag }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="附件" :span="2">
          <span v-if="!form.filePath">—</span>
          <file-upload v-else v-model="form.filePath" :limit="1" :file-type="['pdf']" disabled />
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ form.createByName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ form.createTime }}</el-descriptions-item>
      </el-descriptions>
      <div class="kb-content" v-html="form.content"></div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detail.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="KbKnowledgeSearch" lang="ts">
import { getKnowledge, listKnowledge } from '@/api/kb/knowledge';
import { KnowledgeQuery, KnowledgeVO } from '@/api/kb/knowledge/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useDict } from '@/utils/dict';

const knowledgeList = ref<KnowledgeVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();
const { yw_knowledge_status: statusOptions } = useDict('yw_knowledge_status');

const form = ref<KnowledgeVO>({} as KnowledgeVO);
const detail = reactive({ visible: false, title: '知识详情' });

const queryParams = ref<KnowledgeQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  // 查询页默认看已入库
  status: '2'
});

const splitTags = (tags?: string) => {
  if (!tags) return [];
  return tags
    .split(/[,，;；]/)
    .map((item: string) => item.trim())
    .filter((item: string) => !!item);
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listKnowledge(queryParams.value);
    knowledgeList.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  afterReset: () => {
    queryParams.value.status = '2';
    handleQuery();
  }
});

const handleView = async (row: Partial<KnowledgeVO>) => {
  const res = await getKnowledge(row.id!);
  form.value = res.data;
  detail.visible = true;
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.kb-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

.kb-content {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  max-height: 420px;
  overflow: auto;
  line-height: 1.7;
}
</style>
