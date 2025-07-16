// Package utils this is for pagination
package utils

import (
	"net/url"
	"strconv"
)

type PaginationParams struct {
	Page     int
	PageSize int
	SortBy   string
	Order    string
}

func ParsePaginationParams(query url.Values) PaginationParams {
	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))
	sortBy := query.Get("sort_by")
	order := query.Get("order")

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10
	}
	if order != "asc" && order != "desc" {
		order = "desc"
	}
	if sortBy == "" {
		sortBy = "created_at"
	}

	return PaginationParams{
		Page:     page,
		PageSize: pageSize,
		SortBy:   sortBy,
		Order:    order,
	}
}
