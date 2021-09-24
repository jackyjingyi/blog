/**
 * 项目类型统计
 * Created by wrb on 2020/6/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_pro_type",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._filterData = {};//筛选条件
        this._dataList = [];//列表
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_stats/m_stats_pro_type',{});
            $(that.element).html(html);
            $(that.element).find('input[name="year"]').val(new Date().getFullYear());
            that.initSelect2ByOrgZone();
            that.initSelect2ByDeanName();
            that.renderDataList();

        }
        //渲染list
        ,renderDataList:function (t) {
            var that = this;

            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listProjectTypeStatic;
            option.postData = $(that.element).find('form.filter-form').serializeObject();
            //option.postData.year = $(that.element).find('input[name="year"]').val()-0;

            option.postData = $.extend({}, option.postData, that._filterData);
            option.postData = filterParam(option.postData);
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var yearList = [];
                    for(var i=4;i>=0;i--){
                        yearList.push(option.postData.year-i);
                    }

                    var html = template('m_stats/m_stats_pro_type_list',{
                        dataList:response.data,
                        year:option.postData.year,
                        yearList:yearList
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.length);
                    that.renderFilterResult();
                    that.bindBtnActionClick();
                    that.sortActionClick();
                    return false;
                }else {
                    S_layer.error(response.info);
                }
            })


        }
        //初始化select2
        ,initSelect2ByOrgZone:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listZone;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var staffArr = [{id:'',text:'全部'}];
                    if(response.data!=null && response.data.length>0){
                        $.each(response.data, function (i, o) {
                            staffArr.push({
                                id: o.id,
                                text: o.orgName
                            });
                        });
                    }

                    var $select = $(that.element).find('select[name="orgId"]');
                    $select.select2({
                        //tags: true,
                        language: "zh-CN",
                        width:'200px',
                        minimumResultsForSearch: Infinity,
                        //placeholder: '请选择所属公司',
                        data: staffArr
                    });
                }else {
                    S_layer.error(response.info);
                }
            })

        }
        ,initSelect2ByDeanName:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listProjectDean;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var staffArr = [{id:'',text:'全部'}];
                    if(response.data!=null && response.data.length>0){
                        $.each(response.data, function (i, o) {
                            staffArr.push({
                                id: o.companyUserId,
                                text: o.userName
                            });
                        });
                    }

                    var $select = $(that.element).find('select[name="deanName"]');
                    $select.select2({
                        //tags: true,
                        language: "zh-CN",
                        width:'200px',
                        minimumResultsForSearch: Infinity,
                        //placeholder: '请选择分管院长',
                        data: staffArr
                    });
                    //$select.val(that._currentCompanyId).trigger('change');

                }else {
                    S_layer.error(response.info);
                }
            })

        }
        //按钮事件绑定
        ,bindBtnActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'search':
                        that.renderFilterResult();
                        that.renderDataList();
                        break;
                    case 'refreshBtn':
                        that.init();
                        break;
                }
                return false;
            });
        }
        //排序
        ,sortActionClick:function () {
            var that = this;
            $(that.element).find('th[data-action="sort"]').each(function () {
                var $this = $(this),code = $this.attr('data-code');
                code = code+'Order';
                var sortField = that._filterData[code];
                var sortClass = '';
                if(sortField=='0'){
                    sortClass = 'sorting_asc';
                }else if(sortField=='1'){
                    sortClass = 'sorting_desc';
                }else{
                    sortClass = 'sorting';
                }
                $this.removeClass('sorting_asc sorting_desc sorting').addClass(sortClass);
                $this.off('click').on('click',function (e) {

                    $(that.element).find('th[data-action="sort"]').each(function () {
                        var iCode =  $(this).attr('data-code') + 'Order';
                        if(code!=iCode){
                            that._filterData[iCode] = null;
                            $(this).removeClass().addClass('sorting');
                        }
                    });
                    if($this.hasClass('sorting')||$this.hasClass('sorting_asc')){
                        that._filterData[code] = '1';
                        sortClass = 'sorting_desc';
                    }
                    else if($this.hasClass('sorting_desc')){
                        that._filterData[code] = '0';
                        sortClass = 'sorting_asc';
                    }else{
                        sortClass = 'sorting';
                    }

                    $this.removeClass().addClass(sortClass);

                    that.renderDataList();

                    e.stopPropagation();
                    return false;
                });
            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //分管院长
            var $deanName = $(that.element).find('select[name="deanName"] option:selected');
            if(!isNullOrBlank($deanName.val())){
                resultList.push({
                    name:$deanName.text(),
                    type:1
                });
            }
            //所属公司
            var $orgId = $(that.element).find('select[name="orgId"] option:selected');
            if(!isNullOrBlank($orgId.val())){
                resultList.push({
                    name:$orgId.text(),
                    type:2
                });
            }
            resultList.push({
                name:$(that.element).find('input[name="year"]').val()+'年',
                type:3
            });

            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//分管院长

                    $(that.element).find('select[name="deanName"]').val('').trigger('change');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==2){//所属公司

                    $(that.element).find('select[name="orgId"]').val('').trigger('change');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==3){//所属年度

                    $(that.element).find('input[name="year"]').val(new Date().getFullYear());
                    $(that.element).find('button[data-action="search"]').click();

                }

            });
        }


    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
